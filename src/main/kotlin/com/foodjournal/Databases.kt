package com.foodjournal

import com.codahale.metrics.*
import io.ktor.http.*
import io.ktor.resources.*
import io.ktor.serialization.gson.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
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
import io.ktor.server.sessions.*
import io.ktor.server.thymeleaf.Thymeleaf
import io.ktor.server.thymeleaf.ThymeleafContent
import java.util.concurrent.TimeUnit
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver

fun Application.configureDatabases() {
    val database = Database.connect(
        url = "jdbc:mysql://localhost:3306/auth",
        user = "root",
        driver = "com.mysql.cj.jdbc.Driver",
        password = "mysql",
    )
    /*User management
        /accounts                           <--- PUT/POST/DELETE ||| Change Password / Create Account / Delete Account
     */
    val userService = UserService(database)
    routing {
        //Create account
        post("/accounts") {
            val user = call.receive<ExposedUser>()
            userService.create(user);
        }


        authenticate("auth-session") {
                //Change password
                put("/accounts") {
                    val parameters = call.receiveParameters()
                    val session = call.sessions.get<UserSession>()

                    val pass = parameters["password"] ?: return@put call.respondText(
                        "Missing password", status = HttpStatusCode.BadRequest)
                    if (session == null) {
                        call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                    } else {
                        val login = session.login

                        val user = ExposedUser(login, pass);
                        userService.update(user);
                    }

                }

                //Delete account
                delete("/accounts") {
                    val session = call.sessions.get<UserSession>()
                    if (session == null) {
                        call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                    } else {
                        val login = session.login
                        userService.delete(login);
                    }

                }

            }
        }

    /*
        /incomes						    <--- GET/PUT/POST/DELETE
        /preferences						<--- GET/PUT/POST/DELETE
     */
    val incomesService = IncomesService(database)
    routing {
        authenticate("auth-session") {

            get("/incomes") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    call.respond(incomesService.read(login))
                }
            }
            delete("/incomes/{id}") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
                    incomesService.delete(id, login)
                    //TODO: Exception handling
                    //Theoretically speaking we will not delete incomes that not belongs to its owner but actually will say that we deleted something.
                    call.respondText("Deleted successfully", status = HttpStatusCode.OK)
                }
            }
            put("/incomes") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
                    val json = call.parameters["json"]?: throw IllegalArgumentException("Invalid JSOn")
                    incomesService.update(ExposedIncome(id, login, json))
                    call.respondText("Updated successfully", status = HttpStatusCode.OK)
                }
            }
            post("/incomes") {
                val income = call.receive<ExposedIncome>()
                incomesService.create(income)
            }

        }
    }


    val preferencesService = PreferencesService(database)
    routing {
        authenticate("auth-session") {

            get("/preferences") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    call.respond(preferencesService.read(login))
                }
            }
            delete("/preferences/{id}") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
                    preferencesService.delete(id, login)
                    //TODO: Exception handling
                    //Theoretically speaking we will not delete preferences that not belongs to its owner but actually will say that we deleted something.
                    call.respondText("Deleted successfully", status = HttpStatusCode.OK)
                }
            }
            put("/preferences") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
                    val json = call.parameters["json"] ?: throw IllegalArgumentException("Invalid JSOn")
                    preferencesService.update(ExposedPreference(id, login, json))
                    call.respondText("Updated successfully", status = HttpStatusCode.OK)
                }
            }
            post("/preferences") {
                val preference = call.receive<ExposedPreference>()
                preferencesService.create(preference)
            }

        }
    }

}
