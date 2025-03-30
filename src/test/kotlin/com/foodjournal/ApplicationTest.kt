package com.foodjournal

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import org.jetbrains.exposed.sql.Database

class ApplicationTest {
    @Test
    fun unloginTest() = testApplication {
        application {
            module()
        }
        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }
        val response = client.delete("/login") {
            header(HttpHeaders.Origin, "http://localhost:8080")
            header(HttpHeaders.Host, "localhost:8080")
        }
        assertEquals(HttpStatusCode.OK, response.status)
    }

    @Test
    fun testStaticFiles1() = testApplication {
        application {
            module()
        }
        val response = client.get("/static/login.html")
        assertEquals(HttpStatusCode.OK, response.status)
    }
    @Test
    fun testStaticFiles2() = testApplication {
        application {
            module()
        }
        val response = client.get("/static/index.html")
        assertEquals(HttpStatusCode.OK, response.status)
    }
    @Test
    fun testStaticFiles3() = testApplication {
        application {
            module()
        }
        val response = client.get("/static/assets/css/index.css")
        assertEquals(HttpStatusCode.OK, response.status)
    }
    @Test
    fun testStaticFiles4() = testApplication {
        application {
            module()
        }
        val response = client.get("/static/assets/fonts/LexendDeca-Black.ttf")
        assertEquals(HttpStatusCode.OK, response.status)
    }
    @Test
    fun testStaticFiles5() = testApplication {
        application {
            module()
        }
        val response = client.get("/static/assets/images/arrowDown.png")
        assertEquals(HttpStatusCode.OK, response.status)
    }
    @Test
    fun testStaticFiles6() = testApplication {
        application {
            module()
        }
        val response = client.get("/static/assets/js/index.js")
        assertEquals(HttpStatusCode.OK, response.status)
    }
    @Test
    fun testHashing1() = testApplication {
        assertEquals(true, verifyPassword("7fmahy4ccgm_yyf", hashPassword("7fmahy4ccgm_yyf")))
    }
    @Test
    fun testHashing2() = testApplication {
        assertEquals(true, verifyPassword("HASHING", hashPassword("HASHING")))
    }
    /*
    @Test
    */fun testRegistration() = testApplication {
        application {
            module()
        }
        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }
        val response = client.post("/accounts") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            header(HttpHeaders.Host, "localhost:8080")
            setBody(""" {"login":"testuser102", "pass":"testpass"} """)
        }
        println("Response status: ${response.status}")
        println("Response body: ${response.bodyAsText()}")

        assertEquals(HttpStatusCode.OK, response.status)
    }

    @Test
    fun testRegistration2() = testApplication {
        application {
            module()
        }
        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }
        val response = client.post("/accounts") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            header(HttpHeaders.Host, "localhost:8080")
            setBody(""" {"login":"testuser", "pass":"testpass"} """)
        }
        println("Response status: ${response.status}")
        println("Response body: ${response.bodyAsText()}")

        assertEquals(HttpStatusCode.Conflict, response.status)
    }
    @Test
    fun testLogin1() = testApplication {
        application {
            module()
        }
        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }
        val response = client.post("/login") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            header(HttpHeaders.Host, "localhost:8080")
            setBody(""" {"login":"testuser", "pass":"testwrongpass"} """)
        }

        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }
    @Test
    fun testLogin2() = testApplication {
        application {
            module()
        }
        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }
        val response = client.post("/login") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            header(HttpHeaders.Host, "localhost:8080")
            setBody(""" {"login":"testuser", "pass":"testpass"} """)
        }

        assertEquals(HttpStatusCode.OK, response.status)
    }

    @Test
    fun testGoals() = testApplication {
        val database = Database.connect(
            url = "jdbc:mysql://localhost:3306/auth",
            user = "root",
            driver = "com.mysql.cj.jdbc.Driver",
            password = "mysql",
        )
        val goalsService = GoalsService(database)
        goalsService.delete("testuser")
        assertEquals(null, goalsService.read("testuser"))
    }
    @Test
    fun testGoals1() = testApplication {
        val database = Database.connect(
            url = "jdbc:mysql://localhost:3306/auth",
            user = "root",
            driver = "com.mysql.cj.jdbc.Driver",
            password = "mysql",
        )
        val goalsService = GoalsService(database)
        goalsService.delete("testuser")
        assertEquals("testuser", goalsService.create(InsertGoal( "testuser", """ "{"json":"test""}" """)))
    }
    @Test
    fun testGoals2() = testApplication {
        val database = Database.connect(
            url = "jdbc:mysql://localhost:3306/auth",
            user = "root",
            driver = "com.mysql.cj.jdbc.Driver",
            password = "mysql",
        )
        val goalsService = GoalsService(database)
        goalsService.delete("testuser")
        assertEquals("testuser", goalsService.create(InsertGoal( "testuser", """ "{"json":"testo""}" """)))
    }
    @Test
    fun testGoals3() = testApplication {
        val database = Database.connect(
            url = "jdbc:mysql://localhost:3306/auth",
            user = "root",
            driver = "com.mysql.cj.jdbc.Driver",
            password = "mysql",
        )
        val goalsService = GoalsService(database)
        assertEquals(ExposedGoal("testuser", """ "{"json":"testo""}" """), goalsService.read("testuser"))
    }


    @Test
    fun testIncomes() = testApplication {
        val database = Database.connect(
            url = "jdbc:mysql://localhost:3306/auth",
            user = "root",
            driver = "com.mysql.cj.jdbc.Driver",
            password = "mysql",
        )
        val incomesService = IncomesService(database)
        val id = incomesService.create(InsertIncome("testuser", """ "{"json":"testo""}" """))
        assertEquals(incomesService.readById(id), ExposedIncome(id, "testuser", """ "{"json":"testo""}" """))
    }
    @Test
    fun testPreferences() = testApplication {
        val database = Database.connect(
            url = "jdbc:mysql://localhost:3306/auth",
            user = "root",
            driver = "com.mysql.cj.jdbc.Driver",
            password = "mysql",
        )
        val preferencesService = PreferencesService(database)
        val id = preferencesService.create(InsertPreference("testuser", """ "{"json":"testo""}" """))
        assertEquals(preferencesService.readById(id), ExposedPreference(id, "testuser", """ "{"json":"testo""}" """))
    }
}