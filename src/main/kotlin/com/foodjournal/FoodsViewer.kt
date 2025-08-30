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
import kotlinx.serialization.json.JsonIgnoreUnknownKeys
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.Sorts
import com.mongodb.client.model.Projections
import com.mongodb.client.model.Accumulators
import com.mongodb.client.model.Field
import com.mongodb.client.model.UnwindOptions

@JsonIgnoreUnknownKeys
@Serializable
data class Food(
    @Contextual @BsonId val id: ObjectId = ObjectId(),
    val description: String,
    val foodNutrients: List<Nutrient>? = emptyList<Nutrient>()
)

@Serializable
data class FoodDesc(
    @Contextual @BsonId val id: ObjectId = ObjectId(),
    val description: String,
)

@JsonIgnoreUnknownKeys
@Serializable
data class Nutrient(
    val nutrient: NutrientInfo? = null,
    val amount: Double? = 0.0
)

@JsonIgnoreUnknownKeys
@Serializable
data class NutrientInfo(
    val name: String? = "",
    val unitName: String?= ""
)

class FoodsViewer(database: MongoDatabase) {
    private val collection: MongoCollection<Food> = database.getCollection<Food>("foods")

    suspend fun getByQuery(name: String): List<FoodDesc> {
        return collection.aggregate<FoodDesc>(
            listOf(
                Aggregates.match(
                    Filters.expr(
                        Document("\$gt", listOf(
                            Document("\$indexOfCP",
                                listOf(
                                    Document("\$toLower", "\$description"),
                                    Document("\$toLower", name)
                                )
                            ),
                            -1
                        ))
                    )
                ),
                Aggregates.addFields(
                    Field<Any>("substringIndex",
                        Document("\$indexOfCP",
                            listOf(
                                Document("\$toLower", "\$description"),
                                Document("\$toLower", name)
                            )
                        )
                    ),
                ),
                Aggregates.sort(Sorts.ascending("substringIndex")),
                Aggregates.limit(50)
            )
        ).toList()
    }

    suspend fun getByName(name: String): List<Food> {


        val filters = mutableListOf<Bson>()
        filters.add(Filters.eq("description", name))

        val filter = if (filters.isEmpty()) Filters.empty() else Filters.and(filters)

        val mealList = collection.find(filter)
            .limit(2)
            .toList()
        
        return mealList;


        return collection.aggregate<Food>(
            listOf(
                Aggregates.match(
                    Filters.expr(
                        Document("\$gt", listOf(
                            Document("\$indexOfCP",
                                listOf(
                                    Document("\$toLower", "\$description"),
                                    Document("\$toLower", name)
                                )
                            ),
                            -1
                        ))
                    )
                ),
                Aggregates.limit(2)
            )
        ).toList()
    }


    private val nutrientCache = mutableMapOf<String, List<NutrientInfo>>()
    private var lastCacheTime = 0L
    private val CACHE_TTL = 24 * 60 * 60 * 1000 // day

    suspend fun getUniqueNutrientNames(): List<NutrientInfo> {
        val currentTime = System.currentTimeMillis()

        if (nutrientCache.isNotEmpty() && currentTime - lastCacheTime < CACHE_TTL) {
            return nutrientCache["uniqueNutrients"]!!
        }
        
        val result = collection.aggregate<NutrientInfo>(
            listOf(
                Aggregates.unwind(
                    "\$foodNutrients",
                    UnwindOptions().preserveNullAndEmptyArrays(false)
                ),
                Aggregates.group(
                    Document().apply {
                        put("name", "\$foodNutrients.nutrient.name")
                        put("unitName", "\$foodNutrients.nutrient.unitName")
                    }
                ),
                Aggregates.project(
                    Document().apply {
                        put("_id", 0)
                        put("name", "\$_id.name")
                        put("unitName", "\$_id.unitName")
                    }
                ),
                Aggregates.sort(Document("name", 1))
            )
        ).toList()
        
        nutrientCache["uniqueNutrients"] = result
        lastCacheTime = currentTime
        
        return result
    }
}