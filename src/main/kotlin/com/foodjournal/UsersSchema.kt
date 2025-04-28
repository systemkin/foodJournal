package com.foodjournal

import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction


class UserService(database: Database) {
    object Users : Table() {
        val login = varchar("login", length = 128).uniqueIndex()
        val pass = varchar("pass", length = 128)
        val email = varchar("email", length = 128)

        override val primaryKey = PrimaryKey(login)
    }

    init {
        transaction(database) {
            SchemaUtils.create(Users)
        }
    }

    suspend fun create(user: ExposedUser) = dbQuery {
        Users.insert {
            it[pass] = hashPassword(user.pass)
            it[login] = user.login
            it[email] = user.email
        }
    }

    suspend fun read(login: String): ExposedUser? {
        return dbQuery {
            Users.selectAll()
                .where { Users.login eq login }
                .map { ExposedUser(it[Users.login], it[Users.pass], it[Users.email]) }
                .singleOrNull()
        }
    }

    suspend fun update(user: ExposedUser) {
        dbQuery {
            Users.update({ Users.login eq user.login }) {
                it[pass] = hashPassword(user.pass)
                it[email] = user.email
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

