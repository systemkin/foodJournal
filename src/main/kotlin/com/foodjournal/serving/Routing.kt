package com.foodjournal.serving

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.auth.*
import io.ktor.server.sessions.*
import com.foodjournal.views.*

fun Application.configureRouting() {
    install(io.ktor.server.resources.Resources)

    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(text = "500" , status = HttpStatusCode.InternalServerError) //$cause
        }
    }

    routing {
        authenticate("auth-session") {
            get("/auth") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    call.respondText(session.login)
                }
            }

        }
        staticResources("/static", "static")


        //Login to app
        post("/login") {
            val user = call.receive<ExposedUser>()
            if (com.foodjournal.security.authenticate(user.login, user.pass)) {
                call.sessions.set(UserSession(user.login, user.pass))
                val login = user.login
                call.respondText("Logged in as $login")
            } else {
                call.respondText("Invalid credentials", status = HttpStatusCode.Unauthorized)
            }
        }

        //logoff
        delete("/login") {
            call.sessions.clear<UserSession>()
            call.respondText("Logged out successfully", status = HttpStatusCode.OK)
        }
    }
}