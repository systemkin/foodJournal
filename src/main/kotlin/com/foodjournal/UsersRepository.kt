package com.foodjournal

import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction
import kotlinx.serialization.Serializable
import org.bson.BsonType
import org.bson.codecs.pojo.annotations.BsonId
import org.bson.codecs.pojo.annotations.BsonRepresentation
import org.bson.types.ObjectId
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Updates
import com.mongodb.kotlin.client.coroutine.MongoClient
import com.mongodb.kotlin.client.coroutine.MongoCollection
import com.mongodb.kotlin.client.coroutine.MongoDatabase
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import org.bson.conversions.Bson
import kotlinx.serialization.Contextual
import org.bson.Document

@Serializable
data class User(
    @Contextual @BsonId val id: ObjectId = ObjectId(),
    val externalAuth: ExternalAuth,
    val dailyGoals: Map<String, Double>
)

@Serializable
data class ExternalAuth(
    val provider: String,
    val accessToken: String,
    val refreshToken: String,
    val data: Map<String, String>
)


class UsersRepository(database: MongoDatabase) {
    private val collection: MongoCollection<User> = database.getCollection<User>("users")
    suspend fun create(user: User): ObjectId {
        collection.insertOne(user)
        return user.id
    }

    suspend fun getById(id: ObjectId): User? {
        return collection.find(Filters.eq("_id", id)).firstOrNull()
    }



    suspend fun update(id: ObjectId, ingredients: List<Map<String, Double>>, time: String): Boolean {
        val result = collection.updateOne(
            Filters.eq("_id", id),
            Updates.combine(
                Updates.set("ingredients", ingredients),
                Updates.set("time", time)
            )
        )
        return result.modifiedCount == 1L
    }

        suspend fun delete(id: ObjectId): Boolean {
            return collection.deleteOne(Filters.eq("_id", id)).deletedCount == 1L
        }

        suspend fun search(
            ownerId: ObjectId? = null,
            isStarred: Boolean? = null,
            timeRange: Pair<String, String>? = null,
            limit: Int = 50
        ): List<User> {
            val filters = mutableListOf<Bson>()

            ownerId?.let { filters.add(Filters.eq("owner", it)) }
            isStarred?.let { filters.add(Filters.eq("isStarred", it)) }
            timeRange?.let { (min, max) ->
                filters.add(Filters.and(
                    Filters.gte("time", min),
                    Filters.lte("time", max)
                ))
            }

            val filter = if (filters.isEmpty()) Filters.empty() else Filters.and(filters)

            return collection.find(filter)
                .limit(limit)
                .toList()
        }
    }