package com.foodjournal

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import org.jetbrains.exposed.sql.Database
/*
fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}
*/
fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
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
    configureSerialization()
    configureDatabases()
    configureTemplating()
    configureMonitoring()
    configureHTTP()
    configureSecurity()
    configureRouting()
}
