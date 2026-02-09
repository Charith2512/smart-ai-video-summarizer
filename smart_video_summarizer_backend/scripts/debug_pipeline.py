from services.summarization import uamsa_algorithm

# A small dummy text that simulates a transcript
dummy_text = (
    "In this video we will discuss the impacts of AI on society. "
    "First, we will look at the economic changes. AI is automating many jobs. "
    "However, it is also creating new opportunities in tech. "
    "Secondly, we will consider the ethical implications. Bias in algorithms is a major concern. "
    "We need to ensure AI is fair and transparent. "
    "Finally, we will look at the future of education. Students are using AI to learn faster. "
    "But we must ensure they still learn critical thinking skills."
) * 50  # Make it long enough for chunking

print("Running pipeline debug...")
res = uamsa_algorithm.summarize(dummy_text, "medium", "paragraph")
print(f"Summary Start: {res['summary_text'][:100]}")
