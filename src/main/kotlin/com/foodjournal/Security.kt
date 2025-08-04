package com.foodjournal
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.plugins.csrf.*
import io.ktor.server.response.*
import io.ktor.server.sessions.*
import org.jetbrains.exposed.sql.*
import org.koin.dsl.module
import org.koin.ktor.ext.inject
import org.koin.ktor.plugin.Koin

import io.ktor.server.routing.*
import org.bson.types.ObjectId
import kotlinx.serialization.Serializable
import io.ktor.client.HttpClient
import io.ktor.serialization.kotlinx.json.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.server.application.*
import kotlinx.serialization.json.Json
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec
import java.util.Base64
import java.security.SecureRandom

class TokenEncryptor(private val secret: String) {
    private val algorithm = "AES/CBC/PKCS5Padding"

    fun encrypt(plaintext: String): EncryptedData {
        val ivBytes = ByteArray(16)
        SecureRandom().nextBytes(ivBytes)
        val iv = IvParameterSpec(ivBytes)
        val keySpec = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "AES")

        val cipher = Cipher.getInstance(algorithm).apply {
            init(Cipher.ENCRYPT_MODE, keySpec, iv)
        }

        val ciphertext = cipher.doFinal(plaintext.toByteArray())

        return EncryptedData(
            iv = Base64.getEncoder().encodeToString(ivBytes),
            ciphertext = Base64.getEncoder().encodeToString(ciphertext)
        )
    }

    fun decrypt(encrypted: EncryptedData): String {
        val iv = IvParameterSpec(Base64.getDecoder().decode(encrypted.iv))
        val keySpec = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "AES")

        val cipher = Cipher.getInstance(algorithm).apply {
            init(Cipher.DECRYPT_MODE, keySpec, iv)
        }

        return String(cipher.doFinal(Base64.getDecoder().decode(encrypted.ciphertext)))
    }
}

@Serializable
data class EncryptedData(val iv: String, val ciphertext: String)



@Serializable
data class UserSession(val id: String)


fun Application.configureSecurity() {
    install(CSRF) {

        // tests Origin is an expected value
        allowOrigin("http://localhost:8080")

        // tests Origin matches Host header
        originMatchesHost()

    }
    install(Sessions) {

        cookie<UserSession>("user_session") {
            cookie.path = "/"
            cookie.maxAgeInSeconds = 60*60*24*30
            transform(
                SessionTransportTransformerEncrypt(
                    System.getenv("SESSION_ENCRYPTION_SECRET").toByteArray(),
                    System.getenv("SESSION_SIGN_SECRET").toByteArray(),
                    backwardCompatibleRead = true
                )
            )
        }
    }
    val redirects by inject<MutableMap<String, String>>()
    val HttpClient by inject<HttpClient>()
    val usersRepository by inject<UsersRepository>()
    val generalApiClient by inject<GeneralApiClient>()
    install(Authentication) {
        session<UserSession>("user_session") {
            validate { session ->
                val user = usersRepository.getById(ObjectId(session.id))
                val data = generalApiClient.getData(ObjectId(session.id)) // can be better, bad to request data to check validity only
                if ((user != null) && (data != null)) {
                    session
                } else {
                    null
                }
            }
            challenge {
                call.respondRedirect("/")
            }
        }
        oauth("auth-oauth-yandex") {
            urlProvider = { "http://localhost:8080/auth/callback/yandex" }
            providerLookup = {
                OAuthServerSettings.OAuth2ServerSettings(
                    name = "yandex",
                    authorizeUrl = "https://oauth.yandex.com/authorize",
                    accessTokenUrl = "https://oauth.yandex.com/token",
                    requestMethod = HttpMethod.Post,
                    clientId = application.getYandexClientId(),
                    clientSecret = application.getYandexClientSecret(),
                    defaultScopes = listOf("login:email", "login:info"), // defined inside Yandex
                    extraAuthParameters = listOf("force_confirm" to "true" ),
                    onStateCreated = { call, state ->
                        call.request.queryParameters["redirectUrl"]?.let {
                            redirects[state] = it //??? clear old states???
                        }
                    }
                )
            }
            client = HttpClient;
        }
        oauth("change-provider-yandex") {
            urlProvider = { "http://localhost:8080/change_provider/callback/yandex" }
            providerLookup = {
                OAuthServerSettings.OAuth2ServerSettings(
                    name = "yandex",
                    authorizeUrl = "https://oauth.yandex.com/authorize",
                    accessTokenUrl = "https://oauth.yandex.com/token",
                    requestMethod = HttpMethod.Post,
                    clientId = application.getYandexClientId(),
                    clientSecret = application.getYandexClientSecret(),
                    defaultScopes = listOf("login:email", "login:info"), // defined inside Yandex
                    extraAuthParameters = listOf("force_confirm" to "true" ),
                    onStateCreated = { call, state ->
                        call.request.queryParameters["redirectUrl"]?.let {
                            redirects[state] = it //??? clear old states???
                        }
                    }
                )
            }
            client = HttpClient;
        }


        oauth("auth-oauth-google") {
            urlProvider = { "http://localhost:8080/auth/callback/google" }
            providerLookup = {
                OAuthServerSettings.OAuth2ServerSettings(
                    name = "google",
                    authorizeUrl = "https://accounts.google.com/o/oauth2/auth",
                    accessTokenUrl = "https://accounts.google.com/o/oauth2/token",
                    requestMethod = HttpMethod.Post,
                    clientId = application.getGoogleClientId(),
                    clientSecret = application.getGoogleClientSecret(),
                    defaultScopes = listOf("https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"),
                    extraAuthParameters = listOf("access_type" to "offline", "prompt" to "consent"),
                    onStateCreated = { call, state ->
                        call.request.queryParameters["redirectUrl"]?.let {
                            redirects[state] = it
                        }
                    }
                )
            }
            client = HttpClient;
        }
        oauth("change-provider-google") {
            urlProvider = { "http://localhost:8080/change_provider/callback/google" }
            providerLookup = {
                OAuthServerSettings.OAuth2ServerSettings(
                    name = "google",
                    authorizeUrl = "https://accounts.google.com/o/oauth2/auth",
                    accessTokenUrl = "https://accounts.google.com/o/oauth2/token",
                    requestMethod = HttpMethod.Post,
                    clientId = application.getGoogleClientId(),
                    clientSecret = application.getGoogleClientSecret(),
                    defaultScopes = listOf("https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"),
                    extraAuthParameters = listOf("access_type" to "offline", "prompt" to "consent"),
                    onStateCreated = { call, state ->
                        call.request.queryParameters["redirectUrl"]?.let {
                            redirects[state] = it
                        }
                    }
                )
            }
            client = HttpClient;
        }


    }
}

val SecurityModule = module {
    single { TokenEncryptor(System.getenv("ENCRYPTION_SECRET")) }
}