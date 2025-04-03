package com.foodjournal

import io.ktor.client.call.*
import io.ktor.http.*
import io.ktor.server.application.*


/*
fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}
*/
fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    configureSerialization()
    configureSecurity()
    configureDatabases()
    configureTemplating()
    configureMonitoring()
    configureHTTP()
    configureRouting()


}
