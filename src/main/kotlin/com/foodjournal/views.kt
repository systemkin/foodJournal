package com.foodjournal

import kotlinx.serialization.Serializable

@Serializable
data class ExposedGoal(val login: String, val json: String)
@Serializable
data class InsertGoal(val login: String, val json: String)
@Serializable
data class ExposedIncome(val id: Int, val login: String, val json: String)
@Serializable
data class InsertIncome(val login: String, val json: String)
@Serializable
data class ExposedPreference(val id: Int, val login: String, val json: String)
@Serializable
data class InsertPreference(val login: String, val json: String)
@Serializable
data class UserSession(val login: String, val pass: String)
@Serializable
data class ExposedUser(val login: String, val pass: String)
@Serializable
data class MyPassword(val pass: String)
@Serializable
data class MyJson(val json: String)
@Serializable
data class MyDateSpan(val dateStart: String, val dateEnd: String)