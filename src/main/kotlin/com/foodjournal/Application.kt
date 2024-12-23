package com.foodjournal

import com.foodjournal.controllers.configureDatabases
import com.foodjournal.security.authenticate
import com.foodjournal.security.configureMonitoring
import com.foodjournal.security.configureSecurity
import com.foodjournal.serving.configureHTTP
import com.foodjournal.serving.configureRouting
import com.foodjournal.serving.configureSerialization
import com.foodjournal.serving.configureTemplating
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import com.foodjournal.views.*

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
