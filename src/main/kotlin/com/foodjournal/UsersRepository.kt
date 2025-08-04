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
data class EncryptedUser(
    @Contextual @BsonId val id: ObjectId = ObjectId(),
    var externalAuth: EncryptedExternalAuth,
    val dailyGoals: List<Nutrient> = emptyList()
)

@Serializable
data class EncryptedExternalAuth(
    val provider: String,
    var accessToken: EncryptedData,
    val refreshToken: EncryptedData,
    val id: String
)


@Serializable
data class User(
    @Contextual @BsonId val id: ObjectId = ObjectId(),
    var externalAuth: ExternalAuth,
    val dailyGoals: List<Nutrient> = emptyList()
)

@Serializable
data class ExternalAuth(
    val provider: String,
    var accessToken: String,
    val refreshToken: String,
    val id: String
)

class UsersRepository(database: MongoDatabase, private val encryptor: TokenEncryptor) {
    private val collection: MongoCollection<EncryptedUser> = database.getCollection<EncryptedUser>("users")


    private suspend fun encryptUser(user: User) : EncryptedUser {
        return EncryptedUser(
            id = user.id,
            dailyGoals = user.dailyGoals,
            externalAuth = EncryptedExternalAuth(
                provider = user.externalAuth.provider,
                accessToken = encryptor.encrypt(user.externalAuth.accessToken),
                refreshToken = encryptor.encrypt(user.externalAuth.refreshToken),
                id = user.externalAuth.id
            )
        )
    }
    private suspend fun decryptUser(encryptedUser: EncryptedUser) : User {
        return User(
            id = encryptedUser.id,
            dailyGoals = encryptedUser.dailyGoals,
            externalAuth = ExternalAuth(
                provider = encryptedUser.externalAuth.provider,
                accessToken = encryptor.decrypt(encryptedUser.externalAuth.accessToken),
                refreshToken = encryptor.decrypt(encryptedUser.externalAuth.refreshToken),
                id = encryptedUser.externalAuth.id
            )
        )
    }
    suspend fun create(user: User): ObjectId {
        val encryptedUser = encryptUser(user)
        collection.insertOne(encryptedUser)
        return encryptedUser.id
    }

    suspend fun getById(id: ObjectId): User? {
        return collection.find(Filters.eq("_id", id)).firstOrNull()?.let { encryptedUser ->
            decryptUser(encryptedUser)
        }
    }



    suspend fun update(user: User): Boolean {
        val encryptedUser = encryptUser(user)
        val result = collection.updateOne(
            Filters.eq("_id", encryptedUser.id),
            Updates.combine(
                Updates.set("externalAuth", encryptedUser.externalAuth),
                Updates.set("dailyGoals", encryptedUser.dailyGoals)
            )
        )
        return result.modifiedCount == 1L
    }

    suspend fun delete(id: ObjectId): Boolean {
        return collection.deleteOne(Filters.eq("_id", id)).deletedCount == 1L
    }

    suspend fun search (
        provider: String,
        id: String
    ): User? {
        val filters = mutableListOf<Bson>()

        filters.add(Filters.eq("externalAuth.provider", provider))
        filters.add(Filters.eq("externalAuth.id", id))

        val filter = Filters.and(filters)

        return collection.find(filter).firstOrNull()?.let { encryptedUser ->
            decryptUser(encryptedUser)
        }
    }

}