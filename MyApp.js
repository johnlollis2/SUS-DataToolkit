document.addEventListener('DOMContentLoaded', () => {
    const radarChartCtx = document.getElementById('radarChart').getContext('2d');
    const barChartCtx = document.getElementById('barChart').getContext('2d');
    const boxPlotChartCtx = document.getElementById('boxPlotChart').getContext('2d');

    console.log("DOM fully loaded and parsed");

    const sampleData = [
        { Q1: 3, Q2: 2, Q3: 4, Q4: 3, Q5: 5, Q6: 2, Q7: 3, Q8: 4, Q9: 3, Q10: 5 },
        { Q1: 4, Q2: 3, Q3: 5, Q4: 4, Q5: 5, Q6: 3, Q7: 4, Q8: 4, Q9: 4, Q10: 5 },
        { Q1: 5, Q2: 4, Q3: 5, Q4: 4, Q5: 5, Q6: 4, Q7: 5, Q8: 4, Q9: 5, Q10: 5 }
    ];

    const scores = calculateSUSScores(sampleData);
    console.log("Scores calculated:", scores);

    renderBarChart(scores);
    renderRadarChart(sampleData);
    renderBoxPlot(sampleData);
    renderHeatmap(sampleData);

    function calculateSUSScores(data) {
        return data.map(item => {
            const positiveScores = (item.Q1 - 1) + (item.Q3 - 1) + (item.Q5 - 1) + (item.Q7 - 1) + (item.Q9 - 1);
            const negativeScores = (5 - item.Q2) + (5 - item.Q4) + (5 - item.Q6) + (5 - item.Q8) + (5 - item.Q10);
            return (positiveScores + negativeScores) * 2.5;
        });
    }

    function renderBarChart(scores) {
        console.log("Rendering Bar Chart with scores:", scores);
        new Chart(barChartCtx, {
            type: 'bar',
            data: {
                labels: scores.map((_, index) => `User ${index + 1}`),
                datasets: [{
                    label: 'SUS Score',
                    data: scores,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'SUS Score'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'User'
                        }
                    }
                }
            }
        });
    }

    function renderRadarChart(data) {
        const averageScores = {
            Q1: average(data.map(item => item.Q1)),
            Q2: average(data.map(item => item.Q2)),
            Q3: average(data.map(item => item.Q3)),
            Q4: average(data.map(item => item.Q4)),
            Q5: average(data.map(item => item.Q5)),
            Q6: average(data.map(item => item.Q6)),
            Q7: average(data.map(item => item.Q7)),
            Q8: average(data.map(item => item.Q8)),
            Q9: average(data.map(item => item.Q9)),
            Q10: average(data.map(item => item.Q10))
        };

        console.log("Rendering Radar Chart with data:", averageScores);
        new Chart(radarChartCtx, {
            type: 'radar',
            data: {
                labels: Object.keys(averageScores),
                datasets: [{
                    label: 'Average Score',
                    data: Object.values(averageScores),
                    backgroundColor: 'rgba(255, 99, 1
