package com.foodjournal

import io.ktor.client.call.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
fun Application.configureErroeHandling() {
    install(StatusPages) {
        exception<ContentTransformationException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest, mapOf(
                    "error" to "Invalid request body",
                    "details" to cause.message
                )
            )
        }

        exception<NoTransformationFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.UnsupportedMediaType, mapOf(
                    "error" to "Unsupported content type",
                    "supported" to listOf("application/json")
                )
            )
        }
    }
}