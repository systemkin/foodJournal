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
data class Meal(

    @BsonId
    @Contextual val id: ObjectId = ObjectId(),
    val starred: Boolean,
    val time: String,
    val ingredients: List<Ingredient> = emptyList(),
    @Contextual val owner: ObjectId,
    val images: List<String> = emptyList()
)

@Serializable
data class Ingredient(
    val name: String,
    val nutrients: List<Nutrient>
)

@Serializable
data class postMeal(
    val starred: Boolean,
    val time: String,
    val ingredients: List<Ingredient> = emptyList(),
    val images: List<String> = emptyList()
)

@Serializable
data class updateMeal(
    @BsonId
    @Contextual val id: ObjectId = ObjectId(),
    val starred: Boolean,
    val time: String,
    val ingredients: List<Ingredient> = emptyList(),
    val images: List<String> = emptyList()
)

class MealsRepository(database: MongoDatabase) {
    private val collection: MongoCollection<Meal> = database.getCollection<Meal>("meals")
    suspend fun create(meal: Meal): ObjectId {
        collection.insertOne(meal)
        return meal.id
    }

    suspend fun create(postMeal: postMeal, id: ObjectId): ObjectId  {
        val meal = Meal(ObjectId(), postMeal.starred, postMeal.time, postMeal.ingredients, id, postMeal.images)
        return this.create(meal)
    }

    suspend fun getById(id: ObjectId): Meal? {
        return collection.find(Filters.eq("_id", id)).firstOrNull()
    }

    suspend fun getByOwner(ownerId: ObjectId): List<Meal> {
        return collection.find(Filters.eq("owner", ownerId)).toList()
    }
    suspend fun getStarredByOwner(id: ObjectId): List<Meal> {
        return collection.find(Filters.and(
            Filters.eq("_id", id),
            Filters.lte("starred", true)
        )).toList()
    }
    suspend fun updateStarredStatus(id: ObjectId, starred: Boolean): Boolean {
        val result = collection.updateOne(
            Filters.eq("_id", id),
            Updates.combine(
                Updates.set("starred", starred)
            )
        )
        return result.modifiedCount == 1L
    }

    suspend fun update(meal: Meal): Boolean {
        val result = collection.updateOne(
            Filters.eq("_id", meal.id),
            Updates.combine(
                Updates.set("ingredients", meal.ingredients),
                Updates.set("starred", meal.starred),
                Updates.set("time", meal.time),
                Updates.set("images", meal.images)
            )
        )
        return result.modifiedCount == 1L
    }

    suspend fun update(updateMeal: updateMeal): Boolean {
        val existingMeal = this.getById(updateMeal.id);
        if (existingMeal == null) return false;
        val meal = Meal(updateMeal.id, updateMeal.starred, updateMeal.time, updateMeal.ingredients, existingMeal.owner, updateMeal.images)
        return this.update(meal);
    }
    suspend fun delete(id: ObjectId): Boolean {
        return collection.deleteOne(Filters.eq("_id", id)).deletedCount == 1L
    }

    suspend fun search(
        ownerId: ObjectId? = null,
        starred: Boolean? = null,
        timeRange: Pair<String, String>? = null,
        limit: Int = 5000
    ): List<Meal> {
        val filters = mutableListOf<Bson>()

        ownerId?.let { filters.add(Filters.eq("owner", it)) }
        starred?.let { filters.add(Filters.eq("starred", it)) }
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