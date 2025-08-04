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

    suspend fun getByName(name: String): List<Food> {
        return collection.aggregate<Food>(
            listOf(
                Aggregates.match(
                    Filters.expr(
                        Document("\$regexMatch",
                            Document()
                                .append("input", "\$description")
                                .append("regex", name)
                                .append("options", "i")
                        )
                    )
                ),
                Aggregates.addFields(
                    Field<Any>("substringIndex",
                        Document("\$indexOfCP",
                            listOf(Document("\$toLower", "\$description"), name)
                        )
                    ),
                ),
                Aggregates.sort(Sorts.ascending("substringIndex")),
                Aggregates.limit(20)
            )
        ).toList()
    }
    suspend fun getUniqueNutrientNames(): List<NutrientInfo> {
        return collection.aggregate<NutrientInfo>(
            listOf(
                Aggregates.unwind(
                    "\$foodNutrients",
                    UnwindOptions().preserveNullAndEmptyArrays(false) 
                ),
                Aggregates.group(
                    Document().apply {
                        put("nutrientName", "\$foodNutrients.nutrient.name")
                        put("unitName", "\$foodNutrients.nutrient.unitName")
                    }
                ),
                Aggregates.project(
                    Projections.fields(
                        Projections.excludeId(),
                        Projections.computed("nutrientName", "\$_id.nutrientName"),
                        Projections.computed("unitName", "\$_id.unitName")
                    )
                ),
                Aggregates.sort(Document("nutrientName", 1))
            )
        ).toList()
    }
}