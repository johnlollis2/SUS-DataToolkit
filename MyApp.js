document.addEventListener('DOMContentLoaded', () => {
    const radarChartCtx = document.getElementById('radarChart').getContext('2d');
    const barChartCtx = document.getElementById('barChart').getContext('2d');
    const heatmapChartCtx = document.getElementById('heatmapChart').getContext('2d');
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

        new Chart(radarChartCtx, {
            type: 'radar',
            data: {
                labels: Object.keys(averageScores),
                datasets: [{
                    label: 'Average Score',
                    data: Object.values(averageScores),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 5,
                        title: {
                            display: true,
                            text: 'Average Score'
                        }
                    }
                }
            }
        });
    }

    function renderBoxPlot(data) {
        const boxPlotData = [];
        data.forEach((row, index) => {
            for (let i = 1; i <= 10; i++) {
                boxPlotData.push({ question: `Q${i}`, score: row[`Q${i}`] });
            }
        });

        new Chart(boxPlotChartCtx, {
            type: 'boxplot', // This requires a plugin or custom implementation
            data: {
                datasets: [{
                    label: 'Scores',
                    data: boxPlotData,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Question'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    }
                }
            }
        });
    }

    function renderHeatmap(data) {
        const heatmapData = [];
        data.forEach((row, index) => {
            for (let i = 1; i <= 10; i++) {
                heatmapData.push({ x: i, y: index + 1, v: row[`Q${i}`] });
            }
        });

        new Chart(heatmapChartCtx, {
            type: 'matrix',
            data: {
                datasets: [{
                    label: 'Heatmap',
                    data: heatmapData,
                    backgroundColor(context) {
                        const value = context.dataset.data[context.dataIndex].v;
                        const alpha = (value - 1) / 4;
                        return `rgba(255, 99, 132, ${alpha})`;
                    },
                    width(context) {
                        const a = context.chart.chartArea || {};
                        return (a.right - a.left) / 10 - 1;
                    },
                    height(context) {
                        const a = context.chart.chartArea || {};
                        return (a.bottom - a.top) / heatmapData.length - 1;
                    }
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        position: 'top',
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Question'
                        }
                    },
                    y: {
                        type: 'linear',
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'User'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
});
