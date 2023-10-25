function simulation() {
    let startButton = document.getElementById("startButton");
    let newSimButton = document.getElementById("newSimButton");

    originalHTML = document.body.innerHTML;

    const canvas = document.getElementById('tspCanvas');
    const ctx = canvas.getContext('2d');

    const cities = [
        { x: 322, y: 260 },
        { x: 100, y: 150 },
        { x: 200, y: 100 },
        { x: 50,  y: 50  },
        { x: 410, y: 232 },
        { x: 180, y: 40 },
        { x: 300, y: 400 },
        { x: 410, y: 350 },
        { x: 42,  y: 320 }
    ];

    const populationSize = 1000;
    const mutationRate = 0.3;
    const generations = 70;

    let population = [];

    function shuffle(array) {
        for (let i = array.length - 1; i > -1; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function initializePopulation() {
        population = [];
        for (let i = 0; i < populationSize; i++) {
            const order = [...cities];
            shuffle(order);
            population.push(order);
        }
    }

    function drawTour(tour, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tour[0].x, tour[0].y);
        for (const city of tour) {
            ctx.lineTo(city.x, city.y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    function drawCity(city, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(city.x, city.y, 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.font = "14px Arial";
        ctx.fillStyle = "black";
        ctx.fillText(`(${city.x}, ${city.y})`, city.x - 5, city.y + 15);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    keepTrackBestTour = []
    async function drawPopulation(generation) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const tour of population) {
            drawTour(tour, 'rgba(0, 0, 0, 0.2)');
        }
        const bestTour = population[0];
        drawTour(bestTour, 'red');
        for (const city of cities) {
            drawCity(city, 'blue');
        }
        let calcBestTourDist = calculateDistance(bestTour).toFixed(2)
        keepTrackBestTour.push({
            "gen": generation,
            "tour_dist": calcBestTourDist,
            "tour_p": bestTour,
        });
        document.getElementById('GA_res').textContent = "Calculating...";
        document.getElementById('generationGA').textContent = generation;
        document.getElementById('bestFitnessGA').textContent = calcBestTourDist;

        await sleep(100);
    }


    function calculateDistance(tour) {
        let distance = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            const city1 = tour[i];
            const city2 = tour[i + 1];
            distance += calculateDistance1(city2, city1);
        }
        distance += calculateDistance1(tour[0], tour[tour.length - 1])

        return distance;
    }
    function calculateDistance1(city1, city2) {
        const dx = city2.x - city1.x;
        const dy = city2.y - city1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function calculateRankProbabilities(populationSize, fitnessValues) {
        const rankProbabilities = new Array(populationSize);
        for (let i = 0; i < populationSize; i++) {
            rankProbabilities[i] = (populationSize - i) / (populationSize * (populationSize + 1) / 2);
        }
        return rankProbabilities;
    }

    function selectParentRankBased(population, fitnessValues) {
        const rankProbabilities = calculateRankProbabilities(population.length, fitnessValues);
        let random = Math.random();
        for (let i = 0; i < population.length; i++) {
            if (random <= rankProbabilities[i]) {
                return population[i];
            }
        }
    }

    function evolvePopulation() {
        let fitnessValues = population.map(tour => 1 / calculateDistance(tour));
        population.sort((a, b) => fitnessValues[population.indexOf(a)] - fitnessValues[population.indexOf(b)]);
        const newPopulation = [population[0]];
        while (newPopulation.length < populationSize) {
            const parentA = selectParentRankBased(population, fitnessValues);
            const parentB = selectParentRankBased(population, fitnessValues);
            const child = crossover(parentA, parentB);
            mutate(child);
            newPopulation.push(child);
        }
        population = newPopulation;
    }

    function crossover(parentA, parentB) {
        if (!parentA || !parentB || parentA.length === 0 || parentB.length === 0) {
            return [];
        }

        const crossoverPoint = Math.floor(Math.random() * parentA.length);
        const child = [];
        for (let i = 0; i < crossoverPoint; i++) {
            child[i] = parentA[i];
        }
        for (let i = crossoverPoint; i < parentA.length; i++) {
            child[i] = parentB[i];
        }
        const uniqueChild = [...new Set(child)]; 
        return uniqueChild;
    }

    function mutate(tour) {
        const indexA = Math.floor(Math.random() * tour.length);
        const indexB = Math.floor(Math.random() * tour.length);
        [tour[indexA], tour[indexB]] = [tour[indexB], tour[indexA]];
    }

    function isValidTour(tour) {
        return new Set(tour).size === tour.length;
    }

    function drawBestTourPath(r_tour, best_gen, best_tour_path) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < best_tour_path.length; i++) {
            const city = best_tour_path[i];
            const nextCity = best_tour_path[(i + 1) % best_tour_path.length];
            ctx.beginPath();
            ctx.moveTo(city.x, city.y);
            ctx.lineTo(nextCity.x, nextCity.y);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        for (const city of cities) {
            drawCity(city, 'blue');
        }
        document.getElementById("GA_res").remove();
        document.getElementById("generationGA").remove();
        document.getElementById("bestFitnessGA").remove();
        document.getElementById('genId').innerText = "Best GenID: " + best_gen;
        document.getElementById('tID').innerText = "Best Tour Distance (Approx.): " + r_tour;

        //for comparison brute visual
        let y = tspBruteForce(cities).tour;
        var brute_path = []
        for (let i=0; i < y.length; i++) {
            brute_path.push(cities[y[i]])
        }
        console.log("ga: ", best_tour_path)
        console.log("brute: ", brute_path);
        drawTour(brute_path, 'green');
        if (brute_path[0]==best_tour_path[0]) {
            drawCity(brute_path[0], 'black')
        }
        else {
            drawCity(brute_path[0], 'yellow'); // Brute start city
            drawCity(best_tour_path[0], 'purple') //GA start city
        }
        document.getElementById("addText").textContent = "Green path shows the optimal solution (found using bruteforce) for which yellow node is the both starting and end point, on the other hand, Red path is the best approximate path found using our less tweaked Genetic Algorithm, for which the start and end point is purple node. If there is only one black node and others are blue, that means both algorithm started and end in the same black node."
    }

    async function startGA_Sim() {
        for (let generation = 0; generation <= generations; generation++) {
            initializePopulation();
            await drawPopulation(generation);
            evolvePopulation();
            console.log(population)
        }
        let min_dist0 = Infinity;
        let best_gen0 = 0;
        let besttourpath0 = [];
        for (let i = 0; i < keepTrackBestTour.length; i++) {
            if (keepTrackBestTour[i]["tour_dist"] <= min_dist0) {
                min_dist0 = keepTrackBestTour[i]["tour_dist"]
                best_gen0 = keepTrackBestTour[i]["gen"]
                besttourpath0 = keepTrackBestTour[i]["tour_p"]
            }
        }
        drawBestTourPath(min_dist0, best_gen0, besttourpath0);
    }

    function calculateTourDistance(tour, cities) {
        let totalDistance = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            totalDistance += calculateDistance1(cities[tour[i]], cities[tour[i + 1]]);
        }
        totalDistance += calculateDistance1(cities[tour[tour.length - 1]], cities[tour[0]]);
        return totalDistance;
    }

    function generatePermutations(n) {
        const permutations = [];
        const cities = Array.from({ length: n }, (_, i) => i);

        function permute(arr, startIndex) {
            if (startIndex === arr.length - 1) {
                permutations.push([...arr]);
                return;
            }

            for (let i = startIndex; i < arr.length; i++) {
                [arr[startIndex], arr[i]] = [arr[i], arr[startIndex]];
                permute(arr, startIndex + 1);
                [arr[startIndex], arr[i]] = [arr[i], arr[startIndex]];
            }
        }

        permute(cities, 0);
        return permutations;
    }

    function tspBruteForce(cities) {
        const numCities = cities.length;
        const allPermutations = generatePermutations(numCities);
        let minDistance = Infinity;
        let optimalTour;

        for (const permutation of allPermutations) {
            const distance = calculateTourDistance(permutation, cities);
            if (distance < minDistance) {
                minDistance = distance;
                optimalTour = permutation;
            }
        }
        drawTour(optimalTour, 'green');
        return { tour: optimalTour, distance: minDistance };
    }

    function run_Dp() {
        const optimalDistance = tspBruteForce(cities);
        document.getElementById('tddp').textContent = optimalDistance.distance.toFixed(2);
    }

    function attachEventListeners() {
        startButton.addEventListener("click", () => {
            run_Dp();
            startGA_Sim();
            startButton.disabled = true;
        });

        newSimButton.addEventListener("click", () => {
            document.body.innerHTML = originalHTML;
            simulation();
        });
    }

    attachEventListeners();
}
simulation()