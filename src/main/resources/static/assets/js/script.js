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

document.getElementById("tester").style.clipPath = createClipPath(0.49);
