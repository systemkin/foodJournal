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
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory

val securityModule = module {
    val transport = NetHttpTransport()
    val jsonFactory = GsonFactory.getDefaultInstance()

    single {

        GoogleIdTokenVerifier.Builder(transport, jsonFactory)
            .setAudience(listOf(getGoogleClientId()))
            .build()
    }
}

fun Application.getSecret(): String {
    return environment.config.property("ktor.security.secret").getString();
}
fun Application.getGoogleClientId(): String {
    return environment.config.property("ktor.security.google-client-id").getString();
}
fun Application.configureSecurity() {
    val secret = getSecret(); // seems messy
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
        }
    }


}
fun Application.verifyGoogleId(id: String): Boolean {
    val verifier by inject<GoogleIdTokenVerifier>()
    val idToken: GoogleIdToken? = verifier.verify(id)
    if (idToken != null) {
        val payload: Payload = idToken.getPayload()

        val userId: String = payload.getSubject()
        //println("User ID: " + userId)

        val email: String = payload.getEmail()
        val emailVerified: Boolean = java.lang.Boolean.valueOf(payload.getEmailVerified())
        //val name: String = payload.get("name")
        //val pictureUrl: String = payload.get("picture")
        //val locale: String = payload.get("locale")
        //val familyName: String = payload.get("family_name")
        //val givenName: String = payload.get("given_name")
        return true;

    } else {
        return false;
    }
}