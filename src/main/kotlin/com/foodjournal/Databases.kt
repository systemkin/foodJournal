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

import org.bson.Document
import org.bson.types.ObjectId
import com.mongodb.client.model.Indexes
import com.mongodb.kotlin.client.coroutine.MongoClient
import com.mongodb.kotlin.client.coroutine.MongoDatabase
import com.mongodb.client.model.Filters
import org.bson.BsonDocument
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlinx.serialization.json.Json
import com.mongodb.ConnectionString
import java.security.Security

data class dbdata(val dburl: String, val user: String, val password: String, val driver: String)
data class foddDbData(val path: String, val dbname: String)
data class food(
    val id: ObjectId = ObjectId(),
    val description: String,
    val foodNutrients: Document = Document(),
    val nutrientConversionFactors: Document = Document(),
    val foodCategory: Document = Document()
)
data class user(
    val id: ObjectId = ObjectId(),
    val externalAuth: Document = Document(),
    val dailyGoals: Document = Document()
)
data class meal(
    val id: ObjectId = ObjectId(),
    val isStarred: Boolean,
    val time: String,
    val ingredients: Document = Document(),
    val owner: ObjectId
)

fun Application.getDbInfo(): foddDbData {
    return foddDbData(
        environment.config.property("ktor.fooddb.path").getString(),
        environment.config.property("ktor.fooddb.dbname").getString(),
    )
}
fun Application.configureDatabases() {
    install(Koin) {
        modules(SecurityModule, module {
            val dbData = getDbInfo()


            val connectionString = ConnectionString(dbData.path)
            val client = MongoClient.create(connectionString)

            val database: MongoDatabase = client.getDatabase(dbData.dbname)
            single { MealsRepository(database) }
            single { UsersRepository(database, get()) }

        }, OAuthModule)
    }
}