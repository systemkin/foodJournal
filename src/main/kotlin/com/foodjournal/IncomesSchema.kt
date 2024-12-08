package com.foodjournal

import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class ExposedIncome(val id: Int, val login: String, val json: String)
data class InsertIncome(val login: String, val json: String)


class IncomesService(database: Database) {
    object Incomes : Table() {
        val id = integer("id").uniqueIndex().autoIncrement()
        val login = varchar("login", length = 128).references(UserService.Users.login)
        val json = text("json")

        override val primaryKey = PrimaryKey(id)
    }

    init {
        transaction(database) {
            SchemaUtils.create(Incomes)
        }
    }

    suspend fun create(income: InsertIncome): Int = dbQuery {
        Incomes.insert {
            it[login] = income.login
            it[json] = income.json
        }[Incomes.id]
    }

    suspend fun read(login: String): List<ExposedIncome> {
        return dbQuery {
            Incomes.selectAll()
                .where { Incomes.login eq login }
                .map { ExposedIncome(it[Incomes.id], it[Incomes.login], it[Incomes.json]) }
        }
    }
    //Mess
    suspend fun update(income: ExposedIncome) {
        dbQuery {
            Incomes.update({ (Incomes.id eq income.id) and (Incomes.login eq income.login)}) {
                it[json] = income.json
            }
        }
    }

    suspend fun delete(id: Int, login: String) {
        dbQuery {
            Incomes.deleteWhere { (Incomes.id eq id) and (Incomes.login eq login)}
        }
    }

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}
