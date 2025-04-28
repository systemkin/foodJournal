package com.foodjournal

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
import org.koin.ktor.ext.inject
import org.koin.ktor.plugin.Koin
import org.koin.dsl.module
import org.litote.kmongo.coroutine.coroutine
import org.litote.kmongo.reactivestreams.KMongo

data class ExposedUser(val login: String, val pass: String, val email: String)
data class dbdata(val dburl: String, val user: String, val password: String, val driver: String)
data class foddDbData(val path: String, val dbname: String)

fun Application.getMainDatabaseInfo(): dbdata {
    return dbdata(
        environment.config.property("ktor.database.dbname").getString(),
        environment.config.property("ktor.database.user").getString(),
        environment.config.property("ktor.database.password").getString(),
        environment.config.property("ktor.database.driver").getString(),
    )
}
fun Application.getFoodDatabaseInfo(): foddDbData {
    return foddDbData(
        environment.config.property("ktor.fooddb.path").getString(),
        environment.config.property("ktor.fooddb.dbname").getString(),
    )
}
fun Application.configureDatabases() {
    val applicationModule = { dbdata: dbdata ->
        module {
            val foodDbData = getFoodDatabaseInfo()
            val client = KMongo.createClient(foodDbData.path).coroutine
            val fooddb = client.getDatabase(foodDbData.dbname)


            val db = Database.connect(
                url = dbdata.dburl,
                user = dbdata.user,
                driver = dbdata.driver,
                password = dbdata.password
            )
            single { UserService(db) }
            single { IncomesService(db) }
            single { PreferencesService(db) }
            single { GoalsService(db) }
        }
    }
    install(Koin) {
        modules(applicationModule(getMainDatabaseInfo()))
    }
}