FROM public.ecr.aws/lambda/python:3.13

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy required application code and models
COPY api/ api/
COPY services/ services/
COPY models/ models/
COPY tests/ tests/

# Command can be overwritten by providing a different command in the template directly.
CMD ["api.main.handler"]
