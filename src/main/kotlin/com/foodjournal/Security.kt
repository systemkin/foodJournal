package com.foodjournal
import io.ktor.server.application.*
import io.ktor.server.auth.*
import com.codahale.metrics.*
import io.ktor.http.*
import io.ktor.resources.*
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
import io.ktor.server.sessions.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.mindrot.jbcrypt.BCrypt

@Serializable
data class UserSession(val login: String, val pass: String)

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

//TODO: Rewrite (Why use Service.Users if like service is for abstracting from it. Also what a hell)
//Global UserService?
//Or keep it as it is is good approach?
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