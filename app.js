document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const processButton = document.getElementById('processButton');
    const outputDiv = document.getElementById('output');
    const barChartDiv = document.getElementById('barChart');
    const radarChartDiv = document.getElementById('radarChart');

    processButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: function(results) {
                    const susData = results.data.map(row => {
                        return {
                            Q1: parseInt(row.Q1),
                            Q2: parseInt(row.Q2),
                            Q3: parseInt(row.Q3),
                            Q4: parseInt(row.Q4),
                            Q5: parseInt(row.Q5),
                            Q6: parseInt(row.Q6),
                            Q7: parseInt(row.Q7),
                            Q8: parseInt(row.Q8),
                            Q9: parseInt(row.Q9),
                            Q10: parseInt(row.Q10)
                        };
                    });

                    const scores = calculateSUSScores(susData);
                    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

                    outputDiv.innerHTML = `<p>Average SUS Score: ${averageScore.toFixed(2)}</p>`;
                    renderBarChart(scores);
                    renderRadarChart(susData);
                }
            });
        } else {
            alert('Please select a file to process.');
        }
    });

    function calculateSUSScores(data) {
        return data.map(item => {
            const positiveScores = item.Q1 + item.Q3 + item.Q5 + item.Q7 + item.Q9;
            const negativeScores = 5 - item.Q2 + 5 - item.Q4 + 5 - item.Q6 + 5 - item.Q8 + 5 - item.Q10;
            return (positiveScores + negativeScores) * 2.5;
        });
    }

    function renderBarChart(scores) {
        const barChartSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A bar chart of SUS scores.',
            data: {
                values: scores.map((score, index) => ({ user: `User ${index + 1}`, score }))
            },
            mark: 'bar',
            encoding: {
                x: { field: 'user', type: 'ordinal', axis: { title: 'User' } },
                y: { field: 'score', type: 'quantitative', axis: { title: 'SUS Score' } }
            }
        };

        vegaEmbed('#barChart', barChartSpec);
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

        const radarChartSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A radar chart of average SUS question scores.',
            data: {
                values: Object.keys(averageScores).map(key => ({ question: key, score: averageScores[key] }))
            },
            mark: { type: 'line', point: true },
            encoding: {
                theta: { field: 'question', type: 'nominal', axis: { title: 'Question' } },
                radius: { field: 'score', type: 'quantitative', axis: { title: 'Average Score' } }
            }
        };

        vegaEmbed('#radarChart', radarChartSpec);
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
});
