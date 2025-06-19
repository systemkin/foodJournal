# foodJournal
# Uni project

application.yaml = config
application-test.yaml = test config
MongoDB + JDK (23) required

./gradlew clean build + ./gradlew run
no tests = ./gradlew build -x tests

req env variables:

ENCRYPTION_SECRET - for access and refresh tokens encryprion

GOOGLE_CLIENT_ID
<br>GOOGLE_CLIENT_SECRET

YANDEX_CLIENT_ID<br>
YANDEX_CLIENT_SECRET

SESSION_ENCRYPTION_SECRET<br>
SESSION_SIGN_SECRET
