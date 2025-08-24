dailyGoals = [];

unitsMap = new Map();
defaultNutrients = [];
defaultUnitsMap = new Map();
cacheNutrients = "";
cacheMeals = "";
nutrientsActive = true;
endDrag = null;
base = null;
async function fetchDailyGoals() {
    try {
        const response = await fetch("dailygoals")
        if (response.status == 200) {
            const result = await response.json()
            if (result.length != 0) {
                dailyGoals = result;
                if (result != {}) {
                    for (i = 0; i < result.length; i++) {
                        unitsMap.set(result[i].nutrient.name, result[i].nutrient.unitName);
                    }
                    
                }
            }
        } 
    } catch (error) {
        console.error("Error fetching data:", error)
    }
}

async function getTodayMeals() {
    now = new Date()
    offset = now.getTimezoneOffset() * 60000
    localTime = new Date(now.getTime() - offset)
    localDate = localTime.toISOString().slice(0, 11)
    localStart = localDate + "00:00";
    localEnd = localDate + "23:59";

     try {
        const response = await fetch("meals/search?" + new URLSearchParams({
                "start":localStart, 
                "end":localEnd
            }).toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify()
        })

        if (response.status == 200) {
            res = await response.json()
            return res
        }
        
        
    } catch (error) {
        console.error("Error fetching data:", error)
    }
}
async function countMeals(meals) {

    res = new Map();
    
    for (k = 0; k < meals.length; k++) {
        meal = meals[k];
        mulMain = meal.eatenUnits/meal.totalUnits;
        for (i = 0; i < meal.ingredients.length; i++) {
            mul = meal.ingredients[i].units;
            for(j = 0; j < meal.ingredients[i].nutrientsPUnit.length; j++) {
                name = meal.ingredients[i].nutrientsPUnit[j].nutrient.name;
                amount = meal.ingredients[i].nutrientsPUnit[j].amount;
                unitName = meal.ingredients[i].nutrientsPUnit[j].nutrient.unitName;
                if (res.get(name) === undefined) res.set(name, 0);
                if (unitName == unitsMap.get(name))
                    res.set(name, res.get(name) + amount*mul*mulMain)
            }
        }
    }
    return res;
}
async function getMeals(start, end) {
     try {
        const response = await fetch("meals/search?" + new URLSearchParams({
                "start":start, 
                "end":end
            }).toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify()
        })
        if (response.status == 200) {
            res = await response.json()
            return res
        }
    } catch (error) {
        console.error("Error fetching data:", error)
    }
}
async function buildNutrients(start, end) {
    counter = 0;
    journal = document.getElementById("journalHolder");
    document.body.insertAdjacentHTML('beforeend', `
        <div id="infoWindow" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;"> 
            <div style="background-color: #5C5C5C; border-radius: 15px; padding: 10px">
                <div class = "flexer column" > 
                    <div class = "text grayT">Processing... (usually takes a moment)</div>
                </div>
            </div>
        </div> 
        `);
    fetchDailyGoals().then(() => {
        getMeals(start, end).then(res => {
            countMeals(res).then(res2 => {
                cacheNutrients = ""
                journal.innerHTML = ""
                document.getElementById("infoWindow").remove();
                mul = getDayDifference(start, end)
                for (i = 0; i < dailyGoals.length; i++) {
                    eaten = res2.get(dailyGoals[i].nutrient.name);
                    if (eaten == undefined) eaten = 0;
                    percent = eaten/(dailyGoals[i].amount*mul)
                    path = "";
                    if (eaten == 0) {
                        path = createClipPath(0);
                    }
                    else if (percent < 1)
                        path = createClipPath(percent);
                    

                    toAdd = `
                    <div draggable="true" ondragstart="start1()" ondragover="dragover()" id = "a_`+counter+ `" class = "flexer row clickablePlateColor" style = "margin-bottom: 5px; padding: 10px; justify-content: space-between;">
                        <div class = "flexer column" style =  "justify-content: space-between"> 
                            <div class = "text grayT"> `+ dailyGoals[i].nutrient.name +` </div>
                            <div class = "text grayT"> `+ Math.round(eaten) + "/" + Math.round(dailyGoals[i].amount*mul) +" " + dailyGoals[i].nutrient.unitName + ` </div>
                        </div>
                        <div class = "flexer row">
                            <div class="ringSegmentHolder">
                                <div id = "`+ counter +`" class="circleSegment mid backgroundColor" style = "clip-path:`+path+`"></div>
                                <div id = "2_`+ counter + `" class="circleSegment midHover clickablePlateColor"></div>
                                <div class="backgroundedText absolute clickablePlateColor borderMid text grayT">`+ Math.round(percent*100) +`%</div>
                            </div>
                            <div class = "flexer column" style =  "justify-content: space-between; margin-left: 20px"> 
                                <div class = "text grayT" onclick="deleteNutrient(`+counter+`)"> X </div>
                                <div class = "text grayT"onclick="editNutrient(`+counter+`)"> E </div>
                            </div>
                        </div>
                    </div>
                    ` 
                    journal.innerHTML += toAdd
                    cacheNutrients += toAdd
                    
                    counter++;
                }
            });
    })
})
}
async function deleteNutrient(index) {
    dailyGoals.splice(index, 1);
    await putGoals(dailyGoals);
    resetCache();
    check();
    
}

function start1() {
  base = event.target; 
  endDrag = null;
}
function dragover() {
    var e = event;
    var a =e.target;
    var b = e.currentTarget;
    e.preventDefault(); 
     if (base.contains(e.target)) {
        return;
    }
    endDrag = e.target;
}
function end() {
    if (endDrag == null) return;

    while (endDrag.parentElement != null) {
        if (endDrag.id.length != 0) 
            break;
        endDrag = endDrag.parentElement;
    }
    if (endDrag.id.length === 0) 
        return;

    var index1 = base.id
    var index2 = endDrag.id
    index1 = index1.slice(2);
    index2 = index2.slice(2);
    var tmp = dailyGoals[index1];
    var tmp2 = dailyGoals[index2];
    dailyGoals[index1] = tmp2
    dailyGoals[index2] = tmp;

    putGoals(dailyGoals).then(res => {
        if (res == 201) {
            resetCache();
            check();
        } else {
            alert("Unexpected error");
            dailyGoals[index1] = tmp;
            dailyGoals[index2] = tmp2;
        }
    })
}
async function reset() {
    resetCache;
    now = new Date()
    offset = now.getTimezoneOffset() * 60000
    localTime = new Date(now.getTime() - offset)
    localDate = localTime.toISOString().slice(0, 11)
    localStart = localDate + "00:00";
    localEnd = localDate + "23:59";
    document.getElementById("startTime").value = localStart;
    document.getElementById("endTime").value = localEnd;
    check()
}
async function editNutrient(index) {
    if (defaultNutrients.length == 0) {
        document.body.insertAdjacentHTML('beforeend', `
        <div id="nutrientWindow" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;"> 
            <div style="background-color: #5C5C5C; border-radius: 15px; padding: 10px">
                <div class = "flexer column" > 
                    <div class = "text grayT">Loding nutrients... (usually takes 2-5 seconds)</div>
                </div>
            </div>
        </div> 
        `);
    }
    

    suggestions = await buildSuggestions();
    if (document.getElementById("nutrientWindow") != undefined)
        document.getElementById("nutrientWindow").remove();

    document.body.insertAdjacentHTML('beforeend', `
    <div id="nutrientWindow" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;"> 
        <div style="background-color: #5C5C5C; border-radius: 15px; padding: 10px">
            <div class = "flexer column" > 
                <input onchange="manageUnit()" value = "`+dailyGoals[index].nutrient.name+`" placeholder="Name" id="nutrientName" list="suggestions" class = "placeholderGray  center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 15px;  border:2px solid #1e1e1e; border-radius:5px;  font-family: 'Lexend Deca'">
                <datalist id="suggestions">
                    ` + suggestions + `
                </datalist>
                <div class = "flexer row" style = "align-items: center">
                    <input  placeholder="Amount" value = "`+dailyGoals[index].amount +`" type="number" id="nutrientAmount" class = "placeholderGray center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 15px;  border:2px solid #1e1e1e; border-radius:5px; font-family: 'Lexend Deca'">
                </div>
                <div class = "flexer row" style = "align-items: center">
                    <input placeholder="Unit" value = "`+dailyGoals[index].nutrient.unitName +`" id="nutrientUnit" list="suggestions2" class = "placeholderGray center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 15px;  border:2px solid #1e1e1e; border-radius:5px; font-family: 'Lexend Deca'">
                </div>
                <datalist id="suggestions2">
                </datalist>
                <div class = "flexer row space-between">
                    <div onclick = "closeAddNutrient()" class = "flexer text whiteT textButton" style = "align-items: center">
                        Cancel
                    </div> 
                    <div onclick = "confirmEditNutrient(`+index+`)" class = "flexer text whiteT textButton" style = "align-items: center">
                        Confirm
                    </div>  
                </div>
            </div>
        </div>
    </div> 
    `);
}
function createClipPath(part) {
    res = "polygon(50% 50%, 50% 0%"
    part = 1-part
    //if we got 0.3 then it becomes 0.7 - part of a circle to hide

    //We have 4 diagonals on a cube, each "if" hooks onto nearest next (if we moving through cube clockwise) diagonale.
    // angle 1 - angle between diagonale and cut line (not that on 0 degrees, or we would know it - 45, 135...)
    //angle 2 - angle between cut line and cube side
    //side1/2 - opposing sides.
    // side 1 represents side of cube, so we need to find it
    if (part >= 0.875) { //between N line and NE diagonal
        angle1 = 4*(part-0.875)*(Math.PI/2) 
        angle2 = Math.PI-(angle1) - Math.PI/4
        
        side2 = Math.sqrt(2)/2
        side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

        res += ", " + (50+(50-(side1*100))) + "% 0%)"
        return res
    }
    if (part >= 0.625)  { //between NE and SE
        angle1 = 4*(part-0.625)*(Math.PI/2)
        angle2 = Math.PI-(angle1) - Math.PI/4
        
        side2 = Math.sqrt(2)/2
        side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

        res += ",100% 0%, 100% " + Math.abs(100-side1*100) + "%)"
        return res

    }
    if (part >= 0.375)  {
        angle1 = 4*(part-0.375)*(Math.PI/2)
        angle2 = Math.PI-(angle1) - Math.PI/4

        side2 = Math.sqrt(2)/2
        side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

        res += ",100% 0%, 100% 100%, " + side1*100 + "% 100%)"
        return res
    }
    if (part >= 0.125) {
        angle1 = 4*(part-0.125)*(Math.PI/2)
        angle2 = Math.PI-(angle1) - Math.PI/4
        
        side2 = Math.sqrt(2)/2
        side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

        res += ",100% 0%, 100% 100%, 0% 100%, 0% " + side1*100 + "%)"
        return res
    }

    //same, but we anchors not onto diagonal but onto straight line at start, or 'N'
    angle1 = 4*(part)*(Math.PI/2)
    angle2 = Math.PI-(angle1) - Math.PI/2
        
    side2 = 0.5
    side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

    res += ",100% 0%, 100% 100%, 0% 100%, 0% 0%," + (0.5-side1)*100 + "% 0%)"
    return res
}
async function reloadNutrients() {
    now = new Date()
    offset = now.getTimezoneOffset() * 60000
    localTime = new Date(now.getTime() - offset)
    localDate = localTime.toISOString().slice(0, 11)
    localStart = localDate + "00:00";
    localEnd = localDate + "23:59";
    document.getElementById("startTime").value = localStart;
    document.getElementById("endTime").value = localEnd;
    buildNutrients(localStart, localEnd)
}

async function check() {
    start = document.getElementById("startTime").value;
    end = document.getElementById("endTime").value;
    if (nutrientsActive)
        buildNutrients(start, end)
    else buildMeals(start, end)
}
function getDayDifference(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const diffMs = endDate - startDate + 1*60*1000;

    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    return diffDays;
}

async function resetCache() {
    cacheNutrients = "";
    cacheMeals = "";

}
async function resetDate() {
    resetCache()
    check()
}

async function addNutrient() {
    if (defaultNutrients.length == 0) {
        document.body.insertAdjacentHTML('beforeend', `
        <div id="nutrientWindow" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;"> 
            <div style="background-color: #5C5C5C; border-radius: 15px; padding: 10px">
                <div class = "flexer column" > 
                    <div class = "text grayT">Loding nutrients... (usually takes 2-5 seconds)</div>
                </div>
            </div>
        </div> 
        `);
    }
    

    suggestions = await buildSuggestions();
    if (document.getElementById("nutrientWindow") != undefined)
        document.getElementById("nutrientWindow").remove();

    document.body.insertAdjacentHTML('beforeend', `
    <div id="nutrientWindow" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;"> 
        <div style="background-color: #5C5C5C; border-radius: 15px; padding: 10px">
            <div class = "flexer column" > 
                <input onchange="manageUnit()" placeholder="Name" id="nutrientName" list="suggestions" class = "placeholderGray  center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 15px;  border:2px solid #1e1e1e; border-radius:5px;  font-family: 'Lexend Deca'">
                <datalist id="suggestions">
                    ` + suggestions + `
                </datalist>
                <div class = "flexer row" style = "align-items: center">
                    <input  placeholder="Amount" type="number" id="nutrientAmount" class = "placeholderGray center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 15px;  border:2px solid #1e1e1e; border-radius:5px; font-family: 'Lexend Deca'">
                </div>
                <div class = "flexer row" style = "align-items: center">
                    <input placeholder="Unit" id="nutrientUnit" list="suggestions2" class = "placeholderGray center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 15px;  border:2px solid #1e1e1e; border-radius:5px; font-family: 'Lexend Deca'">
                </div>
                <datalist id="suggestions2">
                </datalist>
                <div class = "flexer row space-between">
                    <div onclick = "closeAddNutrient()" class = "flexer text whiteT textButton" style = "align-items: center">
                        Cancel
                    </div> 
                    <div onclick = "confirmAddNutrient()" class = "flexer text whiteT textButton" style = "align-items: center">
                        Confirm
                    </div>  
                </div>
            </div>
        </div>
    </div> 
    `);
}
function buildUnitsMap() {
    defaultUnitsMap.clear();
    for (i = 0; i < defaultNutrients.length; i++) {
        units = defaultUnitsMap.get(defaultNutrients[i].name);
        if (units === undefined)
            defaultUnitsMap.set(defaultNutrients[i].name, [defaultNutrients[i].unitName])
        else {
            unitsNow = defaultUnitsMap.get(defaultNutrients[i].name);
            unitsNow[unitsNow.length] = defaultNutrients[i].unitName;
            defaultUnitsMap.set(defaultNutrients[i].name, unitsNow)
        }
    }
}
async function buildSuggestions() {
    await defaultNutrientsPromise;
    seenSet = new Set();
    result = "";
    for (i = 0; i < defaultNutrients.length; i++) {
        if (!seenSet.has(defaultNutrients[i].name)) {
            seenSet.add(defaultNutrients[i].name);
            result += " <option value='" + defaultNutrients[i].name + "'>";
        }
    }
    return result;
}

async function manageUnit() {

    nutrientName = document.getElementById("nutrientName").value;
    document.getElementById("suggestions2").innerHTML = "";
    if (defaultUnitsMap.get(nutrientName) === undefined) {
        document.getElementById("nutrientUnit").innerHTML = "";
        return;
    }
    if (defaultUnitsMap.get(nutrientName).length == 1)
        document.getElementById("nutrientUnit").value = defaultUnitsMap.get(nutrientName)[0];
    else document.getElementById("nutrientUnit").value = "";
    
    for (i = 0; i < defaultUnitsMap.get(nutrientName).length; i++) {
        document.getElementById("suggestions2").innerHTML += `
        <option value='` + defaultUnitsMap.get(nutrientName)[i] + `'>`;
    }
    

   
}
async function closeAddNutrient() {
    document.getElementById("nutrientWindow").remove();
}

async function getDefaultNutrients() {
    const response = await fetch("defaultnutrients")

    if (response.status = 200) {
        defaultNutrients = await response.json()
        buildUnitsMap()
        return defaultNutrients
    }
    else return []
}

async function confirmAddNutrient() {

    name = document.getElementById("nutrientName").value;
    amount = document.getElementById("nutrientAmount").value;
    unit = document.getElementById("nutrientUnit").value;

    if (name == "") {
        alert("Name must be set");
        return;
    }
    if (amount == "") {
        amount = 0;
    }
   
    dailyGoals[dailyGoals.length] = {"nutrient":{"name":name, "unitName":unit}, amount}


    if (await putGoals(dailyGoals) == 201) {
        document.getElementById("nutrientWindow").remove();
        resetCache();
        check();
    } else {
        alert("Duplicating nutrients! Not saved");
        dailyGoals.splice(dailyGoals.length-1, 1)
    }

}
async function confirmEditNutrient(index) {

    name = document.getElementById("nutrientName").value;
    amount = document.getElementById("nutrientAmount").value;
    unit = document.getElementById("nutrientUnit").value;

    if (name == "") {
        alert("Name must be set");
        return;
    }
    if (amount == "") {
        amount = 0;
    }
    oldGoals = dailyGoals
    dailyGoals[index] = {"nutrient":{"name":name, "unitName":unit}, amount}


    if (await putGoals(dailyGoals) == 201) {
        document.getElementById("nutrientWindow").remove();
        check()
    } else {
        alert("Duplicating nutrients! Not saved");
        dailyGoals = oldGoals
    }

}
async function putGoals(dailyGoals) {
    try {
        const response = await fetch("dailygoals", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dailyGoals)
        }) 
        if (response.status == 201) { // Created
            const result = await response.text();
            return 201;
            
        } else if (response.status == 400) { //Bad request
            return 400;
        }
    } catch (error) {
        console.error("Error sending data:", error)
    }
}
async function reloadMeals() {
    now = new Date()
    offset = now.getTimezoneOffset() * 60000
    localTime = new Date(now.getTime() - offset)
    localDate = localTime.toISOString().slice(0, 11)
    localStart = localDate + "00:00";
    localEnd = localDate + "23:59";
    document.getElementById("startTime").value = localStart;
    document.getElementById("endTime").value = localEnd;
    buildMeals(localStart, localEnd)
}

async function buildMeals(start, end) {
    counter = 0;
    journal = document.getElementById("journalHolder");
    document.body.insertAdjacentHTML('beforeend', `
        <div id="infoWindow" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;"> 
            <div style="background-color: #5C5C5C; border-radius: 15px; padding: 10px">
                <div class = "flexer column" > 
                    <div class = "text grayT">Processing... (usually takes a moment)</div>
                </div>
            </div>
        </div> 
        `);
    fetchDailyGoals().then(() => {
        getMeals(start, end).then(async meals => {
                cacheMeals = ""
                journal.innerHTML = ""
                document.getElementById("infoWindow").remove();
                for (var i = 0; i < meals.length; i++) {
                    var image = /*No image*/ "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAQ3SURBVGhD7ZhZKDZRGMffC7cu3EmUcEGEKCRClqxXRFHWlDvJha2UQhRFsl8IkTuUEiVrsmW/ELJFyFpk5/n6P/VO78w3+eYLY2j+pXmfs4zzm+ec5zznGOiXyCAt+KnSQbQmHURr0kG0pt8Ncnt7S5WVlZSTk0PX19dC+fb2NiUmJtLQ0JCovRYkC4LBp6enk4WFBTU0NNDj4yOXr6yskIODA7W3t0u7fLveBTE3Nyd3d3eanp7mcinI6+srnZyc0MzMDI2Pj7PHXl5eJG9TR++ChIeHU0xMDGVlZdH9/f1fIBsbGxQfH8+eMzMzo8DAQIb6Dr0LkpaWRpOTkxQcHEwdHR00Pz8vAqmurma7qamJ+vr6KCgoiPtcXFxIX/nlehckIyOD7ZKSEnJ1daXOzk4RCOqTkpLo/Pyc7bq6OvLx8aGtrS3R+9SQIpDNzU2KioqisLAwsrGxEYEkJyfT5eUl2y0tLeTh4cFTTm0pAoGwmO3s7HgtGEHy8vLI29ubVldXuU9KSgpFR0fT0dGRydvUkWIQhOCioiIRyMjICHl6ejKMr68ve6OtrU0I12pKFgQRCou3v79fVL6zs0MVFRW0vLzM9vPzM0ey2tpaKi0t5Y3y6elJ1EctyYL8ROkgWpMOojX9bpDT01PKzc3llOSnSBYEGyKSxImJCWmVZiUL8vDwwJve3t4e23jCRs6FVGVtbY137/39fZFtFHKvhYUFrltcXKSbmxuhDh8JdTjjILkcHR2lq6srrsNmijMNPuDc3JyQwymRLAgGGBoayrs1hKezszOnIUhRnJycqLGxkeLi4gS7t7eXd3qoqqqK7O3tydramp/19fVcjiM06mxtbcnFxYXPLwaDgWEgHBnwP6ysrLhfcXExZxlKpBjE0tKSBzE4OMhZMAZTU1PDdmRkJGfHh4eH3H52dpYGBgb4ifwM70J6A68i8SwoKGBPlZWVCSDwaGpqKsXGxtLY2Bh1d3dTQEAADQ8PS0YnL8UgODTt7u4Ktum5A+m7o6MjTzEIUwXTZ2pqis/8fn5+/BsDNvWAqY2P4O/vT/n5+UJbJKPI7ZRIMQhslMvZyIZx4EICifWUmZlJCQkJnEHDU25ubv8EOTg44IEDGv3wB08jm1aiTwdB1oy5v7S0xHWYJjgqAwQLHBcaXV1dXIe2RhAEhJCQEMrOzqazszO2jTNAiT4dZH19nb8k/jDnIyIi+CYGIMfHx3ym9/Ly4rMO2ph6CAEEbbHg8THgWXhKiWRBpPsInrCNl3VSG4sYZxJcDUG4ScHFRHl5ObdrbW0VBoRnc3Mzz330MQW5u7vj36hD//+5kZEF+Soh/Pb09PCUgvcKCws5zOL3R6UqCG5bEJUQujEVEekQ8eCJj0pVkLe3N4bB/oIphIDwGRCQqiBfKR1Ea9JBtCYdRGvSQbQmHURr+jUgfwA7FenjxaAAFQAAAABJRU5ErkJggg=="
                    if (meals[i].images.length != 0) {
                        image = "meals/" +  meals[i].id + "/images/0";
                    }
                    topN = `<div class = "text grayT">No tracing nutrients found</div>`
                    var res = await countMeals([meals[i]]);
                    if (dailyGoals.length != 0) {
                        topNAmnt = res.get(dailyGoals[0].nutrient.name);
                        if (topNAmnt == undefined) topNAmnt = 0;
                        topN = `<div class = "text grayT"> `+ dailyGoals[0].nutrient.name + " " + topNAmnt + " "+ unitsMap.get(dailyGoals[0].nutrient.name) +` </div>`
                    }
                    
                    name = meals[i].description;
                    if (name == "") name = "No name"

                    toAdd = `
                    <div id = "m_ `+counter+ `" class = "flexer row clickablePlateColor" style = "margin-bottom: 5px; padding: 10px; justify-content: flex-start;">
                        <div style = "width:60px; height:60px; margin-right:20px; border-radius: 5px">
                            <a href = '`+image+`' target="_blank">
                                <img style = "height: 100%;
                                    width: 100%;
                                    object-fit: cover; border-radius: 10px; border: 1px solid black" src = '`+image+`'> 
                            </a>
                        </div>
                        <div class = "flexer column" style =  "justify-content: space-between; flex: 1;" onclick = "showDetailed('`+meals[i].id+`')"> 
                            <div class = "text grayT"> `+ name +` </div>
                            <div class = "text grayT"> `+ meals[i].time + ` </div> `+topN+`
                            
                        </div>

                            <div class = "flexer column" style =  "justify-content: space-between; margin-left: 20px; align-items: flex-end;"> 
                                <div class = "text grayT" onclick="deleteMeal('`+meals[i].id+`')"> X </div>
                                <div class = "text grayT"onclick="editMeal('`+meals[i].id+`')"> E </div>
                            </div>

                    </div>
                    ` 
                    journal.innerHTML += toAdd
                    cacheMeals += toAdd
                    counter++;
                }
            })
    })
}
function redirectToAdd() {
    window.location.href = "index.html"
}
async function showDetailed(id) {
    const response = await fetch("/meals/" + id)
    if (response.status == 200) {
        meal = await response.json();

        var result = await countMeals([meal]);
        var toAdd = `
        <div id="detailedInfo" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;">
            <div style="background-color: #5C5C5C; border-radius: 15px; padding: 10px">
                <div class = "flexer column">
        `
        result.forEach((value, key) => {
            toAdd += `
                    <div class = "flexer row space-between">
                        <div class = "text grayT" >`+key+ `
                        </div>
                        <div class = "text grayT"style = "margin-left:5px"> `+ value + " " + unitsMap.get(key) + `
                        </div>
                        
                    </div>`
        })
        toAdd += `
                    <div onclick = "closeDetailed()" class = "flexer text whiteT textButton" style = "align-items: center; justify-content:center">
                        Ok
                    </div> 
                </div>
            </div>
        </div>`
        document.body.insertAdjacentHTML('beforeend', toAdd);
    }

}

async function closeDetailed() {
    document.getElementById("detailedInfo").remove();
}

async function editMeal(id) {
    window.location = '/index.html?mealId='+id;
}
async function deleteMeal(id) {
    const response = await fetch("meals/" + id, {
            method: "DELETE",
        })
    if (response.status == 200) {
        reloadMeals();
        alert("deleted");
        
        
    }
}
async function loadFromCache() {
    if (nutrientsActive) {
        if (cacheNutrients != "")
            document.getElementById("journalHolder").innerHTML = cacheNutrients;
        else check();
    } else {
        if (cacheMeals != "")
            document.getElementById("journalHolder").innerHTML = cacheMeals;
        else check();
    }
}

async function makeMealsActive() {
    document.getElementById("radioMeals").classList = "radioActive center"
    document.getElementById("radioNutrients").classList =  "radioUnactive center" 
    nutrientsActive = false;
    loadFromCache();
}
async function makeNutrientsActive() {
    document.getElementById("radioNutrients").classList = "radioActive center" 
    document.getElementById("radioMeals").classList = "radioUnactive center" 
    nutrientsActive = true;
    loadFromCache();
}



reloadNutrients();

let defaultNutrientsPromise = getDefaultNutrients(); 


document.getElementById('journalHolder').addEventListener('drop', end);