package com.foodjournal

import com.codahale.metrics.*
import io.ktor.http.*
import io.ktor.http.ContentDisposition.Companion.File
import io.ktor.resources.*
import io.ktor.resources.Resources
import io.ktor.serialization.gson.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.metrics.dropwizard.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.csrf.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.resources.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.thymeleaf.Thymeleaf
import io.ktor.server.thymeleaf.ThymeleafContent
import java.util.concurrent.TimeUnit
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.sessions.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.mindrot.jbcrypt.BCrypt;
import io.ktor.server.resources.*
import io.ktor.server.routing.*
import java.io.File

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
            if (authenticate(user.login, user.pass)) {
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