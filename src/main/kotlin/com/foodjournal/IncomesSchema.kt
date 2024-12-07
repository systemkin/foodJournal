package com.foodjournal

import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class ExposedIncome(val login: String, val json: String)

class IncomesService(database: Database) {
    object Incomes : Table() {
        val login = varchar("login", length = 128).uniqueIndex().references(UserService.Users.login)
        val json = text("json")

        override val primaryKey = PrimaryKey(login)
    }

    init {
        transaction(database) {
            SchemaUtils.create(Incomes)
        }
    }

    suspend fun create(income: ExposedIncome): String = dbQuery {
        Incomes.insert {
            it[login] = income.login
            it[json] = income.json
        }[Incomes.login]
    }

    suspend fun read(login: String): ExposedIncome? {
        return dbQuery {
            Incomes.selectAll()
                .where { Incomes.login eq login }
                .map { ExposedIncome(it[Incomes.login], it[Incomes.json]) }
                .singleOrNull()
        }
    }

    suspend fun update(login: String, income: ExposedIncome) {
        dbQuery {
            Incomes.update({ Incomes.login eq login }) {
                it[json] = income.json
            }
        }
    }

    suspend fun delete(login: String) {
        dbQuery {
            Incomes.deleteWhere { Incomes.login eq login }
        }
    }

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}
