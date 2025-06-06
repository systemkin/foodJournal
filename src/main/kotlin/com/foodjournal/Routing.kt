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
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;

fun Application.configureRouting() {
    val MealsRepository by inject<MealsRepository>()

    val secret = getSecret();
    install(io.ktor.server.resources.Resources)

    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(text = "500" , status = HttpStatusCode.InternalServerError) //$cause
        }
    }

}