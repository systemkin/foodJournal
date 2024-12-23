package com.foodjournal.security
import com.foodjournal.models.UserService
import io.ktor.server.application.*
import io.ktor.server.plugins.csrf.*
import org.jetbrains.exposed.sql.*
import io.ktor.server.sessions.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.mindrot.jbcrypt.BCrypt

import com.foodjournal.views.*

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