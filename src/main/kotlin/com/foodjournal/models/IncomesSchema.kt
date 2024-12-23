package com.foodjournal.models

import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction
import com.foodjournal.views.*



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
    suspend fun readById(id: Int): ExposedIncome? {
        return dbQuery {
            Incomes.selectAll()
                .where { Incomes.id eq id }
                .map { ExposedIncome(it[Incomes.id], it[Incomes.login], it[Incomes.json]) }
                .singleOrNull()
        }
    }
    suspend fun readPaged(login: String, page: Int, pageSize: Int): List<ExposedIncome> {
        return dbQuery {
            var offset = (page - 1) * pageSize
            Incomes.selectAll()
                .where { Incomes.login eq login }
                .limit(pageSize).offset(offset.toLong())
                .map { ExposedIncome(it[Incomes.id], it[Incomes.login], it[Incomes.json]) }
        }
    }
    /*
    suspend fun readByDateSpan(login: String, dateSpan: MyDateSpan): List<ExposedIncome> {
        return dbQuery {
            Incomes.selectAll()
                .where { (Incomes.login eq login) and (dateSpan) }
                .map { ExposedIncome(it[Incomes.id], it[Incomes.login], it[Incomes.json]) }
        }
    }

    */
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
