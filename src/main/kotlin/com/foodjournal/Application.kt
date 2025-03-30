package com.foodjournal

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*

/*
fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}
*/
fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    println("Full JDBC URL:")
    configureSerialization()
    configureSecurity()
    configureDatabases()
    configureTemplating()
    configureMonitoring()
    configureHTTP()
    configureRouting()
}
