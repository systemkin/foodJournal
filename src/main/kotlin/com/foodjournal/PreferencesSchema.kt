package com.foodjournal

import com.foodjournal.IncomesService.Incomes
import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction


@Serializable
data class ExposedPreference(val id: Int, val login: String, val json: String)

class PreferencesService(database: Database) {
    object Preferences : Table() {
        val id = integer("id").uniqueIndex()
        val login = varchar("login", length = 128).references(UserService.Users.login)
        val json = text("json")

        override val primaryKey = PrimaryKey(id)
    }

    init {
        transaction(database) {
            SchemaUtils.create(Preferences)
        }
    }

    suspend fun create(preference: ExposedPreference): Int = dbQuery {
        Preferences.insert {
            it[login] = preference.login
            it[json] = preference.json
        }[Preferences.id]
    }

    suspend fun read(login: String): List<ExposedPreference> {
        return dbQuery {
            Preferences.selectAll()
                .where { Preferences.login eq login }
                .map { ExposedPreference(it[Preferences.id], it[Preferences.login], it[Preferences.json]) }
        }
    }

    suspend fun update(preference: ExposedPreference) {
        dbQuery {
            Preferences.update({ (Preferences.id eq preference.id) and (Preferences.login eq preference.login)}) {
                it[json] = preference.json
            }
        }
    }

    suspend fun delete(id: Int, login: String) {
        dbQuery {
            Preferences.deleteWhere { (Preferences.id eq id) and (Preferences.login eq login)}
        }
    }

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}
