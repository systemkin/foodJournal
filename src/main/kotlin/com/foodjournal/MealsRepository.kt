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
import com.sun.tools.attach.AgentLoadException
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import org.bson.conversions.Bson
import kotlinx.serialization.Contextual
import org.bson.Document
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

object ObjectIdAsStringSerializer : KSerializer<ObjectId> {
    override val descriptor: SerialDescriptor = 
        PrimitiveSerialDescriptor("ObjectId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: ObjectId) {
        encoder.encodeString(value.toHexString())
    }

    override fun deserialize(decoder: Decoder): ObjectId {
        return ObjectId(decoder.decodeString())
    }
}

@Serializable
data class Meal(
    val id: String = ObjectId().toHexString(),
    val starred: Boolean,
    val time: String,
    val description: String,
    val ingredients: List<Ingredient> = emptyList(),
    val owner: String,
    val images: List<String> = emptyList(),
    val totalUnits: Double,
    val eatenUnits: Double
)

@Serializable
data class Ingredient(
    val name: String,
    val units: Double,
    val nutrientsPUnit: List<Nutrient>
)

@Serializable
data class postMeal(
    val description: String,
    val starred: Boolean,
    val time: String,
    val ingredients: List<Ingredient> = emptyList(),
    val images: List<String> = emptyList(),
    val totalUnits: Double,
    val eatenUnits: Double
)

@Serializable
data class updateMeal(
    val id: String = ObjectId().toHexString(),
    val starred: Boolean,
    val time: String,
    val description: String,
    val ingredients: List<Ingredient> = emptyList(),
    val images: List<String> = emptyList(),
    val totalUnits: Double,
    val eatenUnits: Double
)
data class dbMeal(
    @BsonId
    val id: ObjectId = ObjectId(),
    val starred: Boolean,
    val time: String,
    val description: String,
    val owner: ObjectId =  ObjectId(),
    val ingredients: List<Ingredient> = emptyList(),
    val images: List<String> = emptyList(),
    val totalUnits: Double,
    val eatenUnits: Double
)
class MealsRepository(database: MongoDatabase) {
    private suspend fun toDbMeal(meal: Meal): dbMeal {
        return dbMeal(ObjectId(meal.id), 
        starred = meal.starred,
        time = meal.time,
        description = meal.description,
        ingredients = meal.ingredients,
        owner = ObjectId(meal.owner),
        images = meal.images,
        totalUnits = meal.totalUnits,
        eatenUnits = meal.eatenUnits)
    }
    private suspend fun fromDbMeal(meal: dbMeal?): Meal? {
        if (meal == null) return meal;
        return Meal(
        meal.id.toHexString(), 
        meal.starred,
        meal.time,
        meal.description,
        meal.ingredients,
        meal.owner.toHexString(),
        meal.images,
        meal.totalUnits,
        meal.eatenUnits
        );
    }
    private val collection: MongoCollection<dbMeal> = database.getCollection<dbMeal>("meals")
    suspend fun create(meal: Meal): String {

        collection.insertOne(toDbMeal(meal))
        return meal.id
    }

    suspend fun create(postMeal: postMeal, id: String): String  {
        val meal = Meal(ObjectId().toHexString(), postMeal.starred, postMeal.time, postMeal.description, postMeal.ingredients, id, postMeal.images, postMeal.totalUnits, postMeal.eatenUnits)
        return this.create(meal)
    }

    suspend fun getById(id: String): Meal? {
            
        return fromDbMeal(collection.find(Filters.eq("_id", ObjectId(id))).firstOrNull())
    }

    /* 
    suspend fun getByOwner(ownerId: String): List<Meal> {
        return collection.find(Filters.eq("owner", ObjectId(ownerId))).toList()
    }
        */
        /* 
    suspend fun getStarredByOwner(id: String): List<Meal> {
        return collection.find(Filters.and(
            Filters.eq("_id", ObjectId(id)),
            Filters.lte("starred", true)
        )).toList()
    }
        */
    suspend fun updateStarredStatus(id: String, starred: Boolean): Boolean {
        val result = collection.updateOne(
            Filters.eq("_id", ObjectId(id)),
            Updates.combine(
                Updates.set("starred", starred)
            )
        )
        return result.modifiedCount == 1L
    }

    suspend fun update(meal: Meal): Boolean {
        val result = collection.updateOne(
            Filters.eq("_id", ObjectId(meal.id)),
            Updates.combine(
                Updates.set("ingredients", meal.ingredients),
                Updates.set("description", meal.description),
                Updates.set("starred", meal.starred),
                Updates.set("time", meal.time),
                Updates.set("images", meal.images),
                Updates.set("totalUnits", meal.totalUnits),
                Updates.set("eatenUnits", meal.eatenUnits),
            )
        )
        return result.modifiedCount == 1L
    }

    suspend fun update(updateMeal: updateMeal): Boolean {
        val existingMeal = this.getById(updateMeal.id);
        if (existingMeal == null) return false;
        val meal = Meal(updateMeal.id, updateMeal.starred, updateMeal.time, updateMeal.description, updateMeal.ingredients, existingMeal.owner, updateMeal.images, updateMeal.totalUnits, updateMeal.eatenUnits)
        return this.update(meal);
    }
    suspend fun delete(id: String): Boolean {
        return collection.deleteOne(Filters.eq("_id", ObjectId(id))).deletedCount == 1L
    }

    suspend fun search(
        ownerId: String? = null,
        starred: Boolean? = null,
        timeRange: Pair<String, String>? = null,
        description: String? = null,
        limit: Int = 5000
    ): List<Meal> {
        val filters = mutableListOf<Bson>()

        ownerId?.let { filters.add(Filters.eq("owner", ObjectId(it))) }
        starred?.let { filters.add(Filters.eq("starred", it)) }
        description?.let { filters.add(Filters.regex("description", it)) }
        timeRange?.let { (min, max) ->
            filters.add(Filters.and(
                Filters.gte("time", min),
                Filters.lte("time", max)
            ))
        }

        val filter = if (filters.isEmpty()) Filters.empty() else Filters.and(filters)

        val mealList = collection.find(filter)
            .limit(limit)
            .toList()
        
        val returnMealList: MutableList<Meal> = mutableListOf()
        for (meal in mealList) {            
            returnMealList.add(fromDbMeal(meal)!!)
        }
        return returnMealList;


       

    }
}