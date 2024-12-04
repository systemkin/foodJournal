package com.foodjournal

import com.codahale.metrics.*
import io.ktor.http.*
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

fun Application.configureRouting() {
    install(io.ktor.server.resources.Resources)
    install(Authentication) {
        session<UserSession>("auth-session") {
            validate { session ->
                session
            }
            challenge {
                call.respondRedirect("/login")
            }

        }
    }
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(text = "500: $cause" , status = HttpStatusCode.InternalServerError)
        }
    }

    routing {
        get("/") {
            call.respondText(hashPassword("BOOOOBA"))
        }
        get<Articles> { article ->
            // Get all articles ...
            call.respond("List of articles sorted starting from ${article.sort}")
        }
        // Static plugin. Try to access `/static/index.html`
        staticResources("/static", "static")
        authenticate("auth-session") {
            get("/checkAuth") {
                // Retrieve the session
                val session = call.sessions.get<UserSession>()

                // Check if the session exists
                if (session != null) {
                    call.respondText("Hello, ${session.login}!")
                } else {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                }
            }
        }

        post("/login") {
            val parameters = call.receiveParameters()
            val login = parameters["login"] ?: return@post call.respondText("Missing login", status = HttpStatusCode.BadRequest)
            val pass = parameters["password"] ?: return@post call.respondText("Missing password", status = HttpStatusCode.BadRequest)

            if (authenticate(login, pass)) {
                call.sessions.set(UserSession(login, pass))
                call.respondText("Logged in as $login")
            } else {
                call.respondText("Invalid credentials", status = HttpStatusCode.Unauthorized)
            }
        }


    }

}
fun authenticate(login: String, pass: String): Boolean {
    return transaction {
        UserService.Users.selectAll()
            .where { UserService.Users.login eq login }
            .map { it[UserService.Users.pass] }
            .singleOrNull()
            ?.let { storedPassword ->
                verifyPassword(pass, storedPassword)
            } ?: false
    }
}
fun hashPassword(password: String): String {
    return BCrypt.hashpw(password, BCrypt.gensalt())
}

fun verifyPassword(plainPassword: String, hashedPassword: String): Boolean {
    return BCrypt.checkpw(plainPassword, hashedPassword)
}

@Serializable
@Resource("/articles")
class Articles(val sort: String? = "new")
