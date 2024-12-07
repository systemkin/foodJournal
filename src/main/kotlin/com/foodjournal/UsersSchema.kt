package com.foodjournal

import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class ExposedUser(val login: String, val pass: String)

class UserService(database: Database) {
    object Users : Table() {
        val login = varchar("login", length = 128).uniqueIndex()
        val pass = varchar("pass", length = 128)

        override val primaryKey = PrimaryKey(login)
    }

    init {
        transaction(database) {
            SchemaUtils.create(Users)
        }
    }

    suspend fun create(user: ExposedUser) = dbQuery {
        Users.insert {
            it[pass] = user.pass
            it[login] = user.login
        }
    }

    suspend fun read(login: String): ExposedUser? {
        return dbQuery {
            Users.selectAll()
                .where { Users.login eq login }
                .map { ExposedUser(it[Users.login], it[Users.pass]) }
                .singleOrNull()
        }
    }

    suspend fun update(login: String, user: ExposedUser) {
        dbQuery {
            Users.update({ Users.login eq login }) {
                //Why i cant?
                //it[login] = user.login
                it[pass] = user.pass
            }
        }
    }


    suspend fun delete(login: String) {
        dbQuery {
            Users.deleteWhere { Users.login eq login }
        }
    }

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}

