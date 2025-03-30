package com.foodjournal
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.csrf.*
import io.ktor.server.response.*
import org.jetbrains.exposed.sql.*
import io.ktor.server.sessions.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.mindrot.jbcrypt.BCrypt

fun Application.configureSecurity() {
    install(Authentication) {
        session<UserSession>("auth-session") {
            validate { session ->
                if (authenticate(session.login, session.pass)) {
                    session
                } else {
                    null
                }
            }
            challenge {
                call.respondRedirect("/static/login.html")
            }

        }
    }
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