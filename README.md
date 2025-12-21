# The Collision Algorithm

[Galperin, “Playing Pool with π (The Number π from a Billiard Point of View)”, 2003](https://www.ams.org/journals/mcom/2003-72-244/S0025-5718-03-01539-X/)


In 2003, physicist Gregory Galperin published a research paper showing how an idealized elastic collision simulation between two blocks can be used to compute digits of π. The setup is famously absurd in its inefficiency, requiring exponentially more collisions to reveal each additional digit, and it has since become known in the mathematics community as one of the most comically impractical ways to approximate π. But it’s such a weird, clever idea that you can’t help wanting to try it.

*Let’s try making it, shall we?*

# Galperin’s core setup

- Place a small block (mass = 1) in front of a wall.
- Place a second block to the right of it with mass = 100 to the power of 𝑛, where is how many digits of π you want to compute.
- Give the larger block a velocity moving toward the smaller one.
- The blocks collide elastically with each other and with the wall.
- Count how many total collisions occur.
- When the big block eventually heads off to the right forever, stop.

The number of collisions (written as digits) = digits of π.