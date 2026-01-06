
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
