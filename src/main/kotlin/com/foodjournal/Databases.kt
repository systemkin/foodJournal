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
import org.litote.kmongo.coroutine.CoroutineClient
import org.litote.kmongo.coroutine.CoroutineDatabase
import org.litote.kmongo.Id
import org.litote.kmongo.newId
import org.bson.Document
import org.bson.types.ObjectId
import com.mongodb.client.model.Indexes
import com.mongodb.kotlin.client.coroutine.MongoClient
import com.mongodb.kotlin.client.coroutine.MongoDatabase

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
        modules(module {
            val dbData = getDbInfo()

            val client = MongoClient.create(dbData.path)
            val database: MongoDatabase = client.getDatabase(dbData.dbname)

            single { MealsRepository(database) }

        }, securityModule)
    }
}