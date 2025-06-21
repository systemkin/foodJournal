package com.foodjournal

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.server.http.*
import io.ktor.client.HttpClient
import org.koin.ktor.ext.inject
import io.ktor.http.HttpMethod
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonIgnoreUnknownKeys
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.Parameters
import io.ktor.client.call.body
import io.ktor.client.request.header
import io.ktor.http.HttpStatusCode
import io.ktor.client.request.forms.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.http.content.*
import org.koin.dsl.module
import org.koin.ktor.ext.inject
import org.koin.ktor.plugin.Koin
import io.ktor.serialization.kotlinx.json.*
import io.ktor.client.plugins.contentnegotiation.*
import javax.xml.crypto.Data

@JsonIgnoreUnknownKeys
@Serializable
data class YandexResponse(val id: String, val default_email: String, val login: String)

@JsonIgnoreUnknownKeys
@Serializable
data class GoogleResponse(val sub: String, val email: String,  val name: String)

@Serializable
data class GeneralUserData(val id: String, val email: String, val name: String)

@JsonIgnoreUnknownKeys
@Serializable
data class tokenResponse(val access_token: String, val refresh_token: String? = null)

fun Application.getYandexClientId(): String {
    return System.getenv("YANDEX_CLIENT_ID")
}
fun Application.getYandexClientSecret(): String {
    return System.getenv("YANDEX_CLIENT_SECRET")
}
fun Application.getGoogleClientId(): String {
    return System.getenv("GOOGLE_CLIENT_ID")
}
fun Application.getGoogleClientSecret(): String {
    return System.getenv("GOOGLE_CLIENT_SECRET")
}

val OAuthModule = module {

    single { mutableMapOf<String, String>() } // Map of redirects

    val httpClient = HttpClient() {
        install(ContentNegotiation) {
            json()
        }
    }
    single { httpClient }  // Clients for requests to OAuth servers
    single { GeneralApiClient(httpClient, get()) } // Clients for requests to OAuth servers

}


// Class for every provider that would recide user-id and can be used to get user info. Autorefresh inside it. If refresh token are invalid -> return null and invalidate session

interface DataProvider {
    suspend fun getData(userId: ObjectId): GeneralUserData?
}

class GoogleApiClient  (
    private val httpClient: HttpClient,
    private val usersRepository: UsersRepository
) : DataProvider {
    private suspend fun refreshToken(userId: ObjectId) : Boolean {
        val user = usersRepository.getById(userId)
        val response = httpClient.submitForm("https://oauth2.googleapis.com/token") {
            parameter("client_id", System.getenv("GOOGLE_CLIENT_ID"))
            parameter("client_secret", System.getenv("GOOGLE_CLIENT_SECRET"))
            parameter("grant_type", "refresh_token")
            parameter("refresh_token", user!!.externalAuth.refreshToken)
        }
        if (response.status == HttpStatusCode.BadRequest) {
            return false // bad grant - refresh token expired
        }
        val tokens = response.body<tokenResponse>()
        user!!.externalAuth.accessToken = tokens.access_token
        usersRepository.update(user)
        return true
    }
    override suspend fun getData(userId: ObjectId) : GeneralUserData? {
        val user = usersRepository.getById(userId)
        val response1 = httpClient.get("https://openidconnect.googleapis.com/v1/userinfo") {
            header("Authorization", "Bearer ${user?.externalAuth?.accessToken}")
        }
        if (response1.status == HttpStatusCode.Unauthorized) {
            if (refreshToken(userId)) {
                val user2 = usersRepository.getById(userId)
                val response2 = httpClient.get("https://openidconnect.googleapis.com/v1/userinfo") {
                    header("Authorization", "Bearer ${user2?.externalAuth?.accessToken}")
                }
                val googleDataResponse = response2.body<GoogleResponse>();
                return GeneralUserData(googleDataResponse.sub, googleDataResponse.email, googleDataResponse.name)
            } else return null // cant retrieve data, refresh token expired
        }
        val googleDataResponse = response1.body<GoogleResponse>();
        return GeneralUserData(googleDataResponse.sub, googleDataResponse.email, googleDataResponse.name)
    }
}
class YandexApiClient (
    private val httpClient: HttpClient,
    private val usersRepository: UsersRepository
) : DataProvider{
    override suspend fun getData(userId: ObjectId) : GeneralUserData? {
        val user = usersRepository.getById(userId)
        var response = httpClient.get("https://login.yandex.ru/info") {
            header("Authorization", "Bearer ${user?.externalAuth?.accessToken}")
        }
        if (response.status == HttpStatusCode.Unauthorized) {
             return null // cant retrieve data, access token expired
        }
        val yandexDataResponse = response.body<YandexResponse>()
        return GeneralUserData(yandexDataResponse.id, yandexDataResponse.default_email, yandexDataResponse.login)
    }
}

class GeneralApiClient (
    private val httpClient: HttpClient,
    private val usersRepository: UsersRepository
) {
    private val googleApiClient = GoogleApiClient(httpClient, usersRepository)
    private val yandexApiClient = YandexApiClient(httpClient, usersRepository)

    private val clients: Map<String, DataProvider> = mapOf(
        "google" to GoogleApiClient(httpClient, usersRepository),
        "yandex" to YandexApiClient(httpClient, usersRepository)
    )

    suspend fun getData(userId: ObjectId): GeneralUserData? {
        val provider = usersRepository.getById(userId)?.externalAuth?.provider;
        return clients[provider]?.getData(userId)
    }
}
