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
fun Application.configureRouting() {
    val secret = getSecret();
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
            if (com.foodjournal.authenticate(user.login, user.pass)) {
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


        post("/restore-password-request") {
            val userEmail = call.receive<MyEmail>()
            val token = JWT.create()
                .withAudience("foodJournal-client-password-restorer")
                .withIssuer("foodJournal-server")
                .withClaim("email", userEmail.email)
                .withExpiresAt(Date(System.currentTimeMillis() + 3_600_000)) // 1 hour
                .sign(Algorithm.HMAC256(secret));
            //TODO: send link to email
            call.respondText("link sent to Email, if one registered", status = HttpStatusCode.OK)}

        authenticate("restore-password") {
            post("/restore-password") {
                val userEmail = call.receive<MyPassword>()
                val principal = call.principal<JWTPrincipal>()
                val email= principal!!.payload.getClaim("email")?.asString()
                //TODO: remake password
                call.respondText("Password changed", status = HttpStatusCode.OK)}
            }
        }
    }
}