package com.foodjournal

import io.ktor.client.call.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import org.jetbrains.exposed.sql.*
import java.nio.file.Paths
import kotlin.io.path.readText
import org.koin.ktor.plugin.Koin
import org.koin.dsl.module

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



