package com.foodjournal

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.auth.*
import io.ktor.server.sessions.*
import com.foodjournal.*
import io.ktor.server.auth.jwt.*
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.util.*
import org.koin.ktor.ext.inject
import org.bson.types.ObjectId
import io.ktor.client.HttpClient
import io.ktor.client.request.*
import io.ktor.client.statement.*
import kotlinx.serialization.Serializable
import io.ktor.http.*
import io.ktor.client.call.body
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonIgnoreUnknownKeys
import io.ktor.http.HttpStatusCode




fun Application.configureRouting() {
    val mealsRepository by inject<MealsRepository>()
    val usersRepository by inject<UsersRepository>()
    val redirects by inject<MutableMap<String, String>>()
    val httpClient by inject<HttpClient>()
    val generalApiClient by inject<GeneralApiClient>()

    install(io.ktor.server.resources.Resources)

    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(text = "$cause", status = HttpStatusCode.InternalServerError) //
        }
    }

    routing {
        authenticate("auth-oauth-yandex") {
            get("/auth/yandex") {
                call.respondText(text = "Logged in", status = HttpStatusCode.OK)
            }
            get("auth/callback/yandex") {
                val currentPrincipal: OAuthAccessTokenResponse.OAuth2? = call.principal()
                currentPrincipal?.let { principal ->
                    principal.state?.let { state ->
                        val yandexUserData = httpClient.get("https://login.yandex.ru/info") {
                            header("Authorization", "Bearer ${principal.accessToken}")
                        }.body<YandexResponse>()
                        val user = usersRepository.search("yandex", yandexUserData.id)
                        if (user == null) {
                            call.sessions.set(
                                UserSession(
                                    usersRepository.create(
                                        User(
                                            ObjectId(),
                                            ExternalAuth("yandex", principal.accessToken, "", yandexUserData.id)
                                        )
                                    ).toString()
                                )
                            )
                        } else call.sessions.set(UserSession(user.id.toString()))
                        

                        redirects[state]?.let { redirect ->
                            call.respondRedirect(redirect)
                            return@get
                        }
                    }
                }
                call.respondRedirect("/")
            }
        }
        authenticate("auth-oauth-google") {
            get("/auth/google") {
                call.respondText(text = "Logged in", status = HttpStatusCode.OK)
            }
            get("auth/callback/google") {
                val currentPrincipal: OAuthAccessTokenResponse.OAuth2? = call.principal()
                currentPrincipal?.let { principal ->
                    principal.state?.let { state ->
                        val googleUserData = httpClient.get("https://openidconnect.googleapis.com/v1/userinfo") {
                            header("Authorization", "Bearer ${principal.accessToken}")
                        }.body<GoogleResponse>()
                        val user = usersRepository.search("google", googleUserData.sub)
                        if (user == null) {
                            call.sessions.set(
                                UserSession(
                                    usersRepository.create(
                                        User(
                                            ObjectId(),
                                            ExternalAuth(
                                                "google",
                                                principal.accessToken,
                                                principal.refreshToken ?: "",
                                                googleUserData.sub
                                            )
                                        )
                                    ).toString()
                                )
                            )
                        } else call.sessions.set(UserSession(user.id.toString()))

                        redirects[state]?.let { redirect ->
                            call.respondRedirect(redirect)
                            return@get
                        }
                    }
                }
                call.respondRedirect("/")
            }
        }
        get("/") {
            call.respondText(text = "Default route", status = HttpStatusCode.OK)
        }
        authenticate("user_session") {
            get("/debug") {
                val session = call.sessions.get<UserSession>()
                val userId = session?.id?.let { ObjectId(it) }
                val user = userId?.let { usersRepository.getById(it) }
                val provider = user?.externalAuth?.provider
                val email = userId?.let { generalApiClient.getData(it)?.email } ?: "NULL"
                val name = userId?.let { generalApiClient.getData(it)?.name } ?: "NULL"
                call.respondText(
                    """
                    Session ID: ${session?.id}
                    User ID: $userId
                    User: ${user?.id}
                    Auth Provider: $provider
                    Email: ${email}
                    Name: ${name}
                """.trimIndent() ?: ""
                )
            }

        }


        authenticate("user_session") {
            authenticate("change-provider-google", strategy = AuthenticationStrategy.Required)  {
                get("/change_provider/google") {
                    call.respondText(text = "Logged in", status = HttpStatusCode.OK)
                }
                get("/change_provider/callback/google") {
                    val session = call.sessions.get<UserSession>()
                    val currentPrincipal: OAuthAccessTokenResponse.OAuth2? = call.principal()
                    currentPrincipal?.let { principal ->
                        principal.state?.let { state ->
                            state?.let { state ->
                                val googleUserData = httpClient.get("https://openidconnect.googleapis.com/v1/userinfo") {
                                    header("Authorization", "Bearer ${principal.accessToken}")
                                }.body<GoogleResponse>()
                                if (usersRepository.search("google", googleUserData.sub) != null) call.respondText("Already exist", status = HttpStatusCode.Conflict)

                                val user = usersRepository.getById(ObjectId(session?.id))

                                user!!.externalAuth = ExternalAuth("google", principal!!.accessToken, principal.refreshToken?: "", googleUserData.sub)

                                usersRepository.update(user)

                                redirects[state]?.let { redirect ->
                                    call.respondRedirect(redirect)
                                    return@get
                                }
                            }
                        }
                    }
                    call.respondRedirect("/")
                }
            }
        }
        authenticate("change-provider-yandex", strategy = AuthenticationStrategy.Required)  {
            get("/change_provider/yandex") {
                call.respondText(text = "Logged in", status = HttpStatusCode.OK)
            }
            get("/change_provider/callback/yandex") {
                val session = call.sessions.get<UserSession>()
                val currentPrincipal: OAuthAccessTokenResponse.OAuth2? = call.principal()
                currentPrincipal?.let { principal ->
                    principal.state?.let { state ->
                        state?.let { state ->
                            val yandexUserData = httpClient.get("https://login.yandex.ru/info") {
                                header("Authorization", "Bearer ${principal.accessToken}")
                            }.body<YandexResponse>()
                            if (usersRepository.search("yandex", yandexUserData.id) != null) call.respondText("Already exist", status = HttpStatusCode.Conflict)

                            val user = usersRepository.getById(ObjectId(session?.id))

                            user!!.externalAuth = ExternalAuth("yandex", principal!!.accessToken, principal.refreshToken?: "", yandexUserData.id)

                            usersRepository.update(user)

                            redirects[state]?.let { redirect ->
                                call.respondRedirect(redirect)
                                return@get
                            }
                        }
                    }
                }
                call.respondRedirect("/")
            }
        }
    }
}