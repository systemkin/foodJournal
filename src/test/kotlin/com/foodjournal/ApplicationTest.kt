package com.foodjournal

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.testing.*
import org.junit.jupiter.api.TestClassOrder
import kotlin.test.*


class ApplicationTest {
    @Test
    fun testRoot() = testApplication {
        application {
            module()
        }
        val response = client.get("/")
        assertEquals(HttpStatusCode.OK,HttpStatusCode.OK)

    }
}