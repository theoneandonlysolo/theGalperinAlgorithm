
# The Galperin Algorithm

  

[Galperin, “Playing Pool with π (The Number π from a Billiard Point of View)”, 2003](https://rcd.ics.org.ru/RD2003v008n04ABEH000252)

  
  

In 2003, physicist Gregory Galperin published a research paper showing how an idealized elastic collision simulation between two blocks can be used to compute digits of π. The setup is famously absurd in its inefficiency, requiring exponentially more collisions to reveal each additional digit, and it has since become known in the mathematics community as one of the most comically impractical ways to approximate π.

  

# Galperin’s core setup

  

- Place a small block (mass = 1) in front of a wall.

- Place a second block to the right of it with mass = 100 to the power of 𝑛, where is how many digits of π you want to compute.

- Give the larger block a velocity moving toward the smaller one.

- The blocks collide elastically with each other and with the wall.

- Count how many total collisions occur.

- When the big block eventually heads off to the right forever, stop.

  

The number of collisions (written as digits) = digits of π.

  
  

| n | Mass ratio    | Collisions ≈ |
| - | ------------- | ------------ |
| 0 | 1 : 1         | 3            |
| 1 | 1 : 100       | 31           |
| 2 | 1 : 10,000    | 314          |
| 3 | 1 : 1,000,000 | 3141         |


 

----------------------
This project visualizes Gregory Galperin’s 2003 discovery:


> two blocks undergoing elastic collisions against each other and a wall encode the digits of π.

  

It’s intentionally the most inefficient π calculator in existence, which made it perfect for a fun portfolio project.

  

But the development journey was not straightforward.

Here’s how it went:

  



  

## **1. Starting Out**

I began with the absolute basics:

- a `<canvas>`

- a 2D rendering context

- drawing lines using `fillRect()`

- drawing rectangles using `strokeRect()`

- placing text with `fillText()`


  

## **2. Coordinates and Rendering**

Next, I had to understand:

- top-left is origin

- positive X is right, positive Y is down

- rectangles draw from their top-left corner

- if I wanted text centered, I had to compute:

  

```js
centerX = x + width/2
centerY = y - height/2
```

whereas x represents the x-coordinate of the block, and y represents the latter.

## **3. Building the Blocks**
Then I represented each block with an object:

    {
      mass, x, y, width, height, vx
    } 

Initially, everything was static, the blocks didn’t move.  
So I created an `animate()` loop using `requestAnimationFrame()` and updated each `x` by implementing a compact form basic physical kinematics (uniform motion):

`x += vx * dt` 

| Symbol | Meaning                                         | Units                          |
| ------ | ----------------------------------------------- | ------------------------------ |
| **x**  | current position (along the x axis)           | meters or pixels               |
| **vx** | velocity in the x-direction                     | meters/second or pixels/second |
| **dt** | delta-time — time that passed since last update | seconds                        |



---
*Then I discovered another issue:*
My animation ran before I clicked a button, meaning my blocks were `null`, leading to errors like:

`Cannot read properties of undefined  (reading 'x')` 

So I introduced:

-   a `running` flag
    
-   a start button that initializes variables
    
-   safety "guards" like `if (!refBlock) return`
    

This stopped animation from triggering prematurely.

  
## **4. Wall Collisions & Velocity**

 #### Collisions 
 For collisions, I added:

-   bounce on the left wall
    
-   `vx *= -1`
    

But the small block got stuck in the wall.  
I learned to **only reverse velocity when moving toward the wall**, and clamp position:

    if (x < 0 && vx < 0) {
      x = 0;
      vx *= -1;
    }`

***extra: Wrong Physical Interpretetation***
Originally, I checked separation using:

`bigBlock.vx > refBlock.vx` 

But that’s backwards.  
After the last physical collision, the small block is faster, not the big one.

That realization came much later, after multiple failed termination attempts.

#### Velocity:

To compute pi using block collisions, I needed formulas that give the **new velocities after two masses collide elastically in 1 dimension.**

Instead of memorizing them, I derived them from first principles of Newton's laws, with the help of my one of my classmates.

## Step 1 — Define the symbols

Two blocks collide on a straight line:

- masses: m1 and m2
- velocities before collision: u1 and u2
- velocities after collision: v1 and v2

Goal: find v1 and v2.

---

## Step 2 — Conservation of momentum

No external force acts horizontally, so momentum stays constant.

Total momentum before = total momentum after:

m1* u1 + m2 * u2 = m1* v1 + m2*v2

Rearrange:

m1*(u1 − v1) = m2*(v2 − u2)

This is Equation (1).


## Step 3 — Conservation of kinetic energy

Because the collision is perfectly elastic, kinetic energy is also conserved:

(1/2)m1* u1² + (1/2)m2 * u2² = (1/2)m1 * v1² + (1/2)m2 * v2²

Multiply by 2:

m1 * u1² + m2 * u2² = m1 * v1² + m2 * v2²

Rearrange:

m1 * (u1² − v1²) = m2 * (v2² − u2²)

Factor the differences of squares:

u1² − v1² = (u1 − v1)(u1 + v1)
v2² − u2² = (v2 − u2)(v2 + u2)

So:

m1*(u1 − v1)*(u1 + v1) = m2*(v2 − u2)*(v2 + u2)

This is Equation (2).


## Step 4 — Divide Equation (2) by Equation (1)

Equation (1):  m1*(u1 − v1) = m2*(v2 − u2)

Divide Equation (2) by Equation (1):

(u1 + v1) = (v2 + u2)

Rearrange:

v2 = u1 + v1 − u2

This gives a relationship between v1 and v2 without squares. Now we can eliminate v2.


## Step 5 — Substitute into momentum equation

Start again from:

m1 * u1 + m2 * u2 = m1 * v1 + m2 * v2

Replace v2 with (u1 + v1 − u2):

m1 * u1 + m2 * u2 = m1 * v1 + m2 * (u1 + v1 − u2)

Expand:

m1 * u1 + m2 * u2 = m1 * v1 + m2 * u1 + m2 * v1 − m2 * u2

Collect terms with v1:

m1 * u1 + m2 * u2 = (m1 + m2) * v1 + m2 * u1 − m2*u2

Move everything but v1 to the left:

m1 * u1 + m2 * u2 − m2 * u1 + m2 * u2 = (m1 + m2) * v1

Combine terms:

(m1 − m2) * u1 + 2 * m2 * u2 = (m1 + m2) * v1

Solve for v1:

v1 = [ (m1 − m2) * u1 + 2 * m2 * u2 ] / (m1 + m2)

That is the first collision formula.


## Step 6 — Solve for v2

Using the earlier relation:

v2 = u1 + v1 − u2

I plugged in v1 and simplified. The final result becomes:

v2 = [ 2* m1 * u1 + (m2 − m1) * u2 ] / (m1 + m2)


##  Final elastic collision equations

    v1 = ((m1 − m2)/(m1 + m2))u1 + (2m2/(m1 + m2))u2
    v2 = (2m1/(m1 + m2))u1 + ((m2 − m1)/(m1 + m2))u2 

---
But the blocks passed through each other; they were moving too fast, and collisions happened between frames.

That’s when I realized I needed **substeps**:

    for (let i = 0; i < 200; i++) { 
         const dt2 = dt / 200;
      // simulate micro-physics 
     }


This fixed tunneling.

## **5. Introducing  n**

I added an input box so users choose **n**, clamping it to `[0,4]`:

-   n = 0 => ~3 collisions
    
-   n = 1 => ~31
    
-   n = 2 => ~314
    
-   n = 3 => ~3141
    

Beyond 4, browsers choke.

## **6. The Camera **

Originally, the camera was fixed. With large n, the blocks left the screen immediately.

So I tried:

### **Attempt A — Follow rightmost**

The camera chased the furthest block. It worked… until termination detection broke completely.

### **Attempt B — Follow mid-point**

Looked smoother visually, but the camera kept drifting forever, so the sim never stopped.

### **Attempt C — Margin-based Panning**

Still too messy, the camera would scroll ahead into empty space.

Eventually, I learned the most important constraint:

> **the camera must have exactly one update location in code, and that update must be behind a boolean gate.**

So I introduced:

`let cameraFrozen = false;` 

and only executed:

`if (!cameraFrozen) cameraX = ...` 

That was a breakthrough.

## **7. Pi-Based Termination Logic**

I tried multiple methods to know//console log when the simulation was “done”:

-  stop when `collisions >= expected` => too abrupt  
-  stop when velocities were equal => numeric noise  
-  stop when “separated enough” => unreliable

Eventually, I separated **two conditions**:

### **A. Pi-Condition (freeze camera)**

When we hit pi-collisions:

`if (collisions >= expected) cameraFrozen = true;` 

That stops visuals from chasing forever.

### **B. Drift Condition (stop physics)**

Once the camera is frozen, I stop the simulation only when:

`both blocks leave the viewport` 

That means:

-   collisions done
    
-   blocks visually exit
    
-   simulation ends cinematically

---

The final solved behavior:

1.  simulate normally
    
2.  follow camera until π collisions reached
    
3.  freeze camera
    
4.  let blocks drift right naturally
    
5.  once both leave screen => stop simulation
    

That kept it functioning and aesthetically pleasing.


## Credits
-  [3Blue1Brown's video](https://www.youtube.com/watch?v=HEfHFsfGXjs&t=82s)  for inspiration

-   Gregory Galperin,  [_Playing Pool with π_ (2003)](https://rcd.ics.org.ru/RD2003v008n04ABEH000252)
    
-   Everyone who attempted visualizations online
- StackOverflow and Reddit
    
-   `console.log()` 


