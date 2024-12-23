package com.foodjournal.models

import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction
import com.foodjournal.views.*


class GoalsService(database: Database) {
    object Goals : Table() {
        val login = varchar("login", length = 128).uniqueIndex().references(UserService.Users.login)
        val json = text("json")

        override val primaryKey = PrimaryKey(login) // Set login as the primary key
    }

    init {
        transaction(database) {
            SchemaUtils.create(Goals)
        }
    }

    suspend fun create(goal: InsertGoal): String = dbQuery {
        Goals.insert {
            it[login] = goal.login
            it[json] = goal.json
        }[Goals.login] // Return the login as the identifier
    }

    suspend fun read(login: String): ExposedGoal? {
        return dbQuery {
            Goals.selectAll()
                .where { Goals.login eq login }
                .map { ExposedGoal(it[Goals.login], it[Goals.json]) }
                .singleOrNull() // Return a single goal or null if not found
        }
    }

    suspend fun update(goal: ExposedGoal) {
        dbQuery {
            Goals.update({ Goals.login eq goal.login }) {
                it[json] = goal.json
            }
        }
    }

    suspend fun delete(login: String) {
        dbQuery {
            Goals.deleteWhere { Goals.login eq login }
        }
    }

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}
