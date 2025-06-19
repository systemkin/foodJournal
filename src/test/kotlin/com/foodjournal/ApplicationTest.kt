package com.foodjournal

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import org.jetbrains.exposed.sql.Database
import io.ktor.server.config.*
import io.ktor.server.config.yaml.*



class ApplicationTest {
    @Test
    fun sanityCheck() {
        assertNotNull(1)
    }


}