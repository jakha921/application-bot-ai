"""
Embeddings Service for RAG (Retrieval-Augmented Generation)
Handles text chunking, embedding generation, and semantic search
"""
import logging
from typing import List, Dict, Tuple, Optional
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingsError(Exception):
    """Custom exception for embeddings-related errors"""
    pass


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200
) -> List[str]:
    """
    Split text into overlapping chunks for embedding
    
    Args:
        text: Text to chunk
        chunk_size: Maximum characters per chunk
        overlap: Number of overlapping characters between chunks
        
    Returns:
        List of text chunks
    """
    if not text or not text.strip():
        return []
    
    # Split by paragraphs first to avoid breaking sentences
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        
        # If adding this paragraph exceeds chunk_size, save current chunk
        if len(current_chunk) + len(paragraph) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            # Start new chunk with overlap from previous
            if overlap > 0 and len(current_chunk) > overlap:
                current_chunk = current_chunk[-overlap:] + "\n\n" + paragraph
            else:
                current_chunk = paragraph
        else:
            # Add paragraph to current chunk
            if current_chunk:
                current_chunk += "\n\n" + paragraph
            else:
                current_chunk = paragraph
    
    # Add final chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    logger.info(f"Split text into {len(chunks)} chunks")
    return chunks


def generate_embeddings_openai(
    texts: List[str],
    model: str = "text-embedding-3-small"
) -> List[List[float]]:
    """
    Generate embeddings using OpenAI API
    
    Args:
        texts: List of texts to embed
        model: OpenAI embedding model to use
        
    Returns:
        List of embedding vectors
        
    Raises:
        EmbeddingsError: If API call fails
    """
    try:
        from openai import OpenAI
        import os
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise EmbeddingsError("OPENAI_API_KEY not found in environment")
        
        client = OpenAI(api_key=api_key)
        
        # OpenAI API accepts batch requests
        response = client.embeddings.create(
            input=texts,
            model=model
        )
        
        embeddings = [item.embedding for item in response.data]
        logger.info(
            f"Generated {len(embeddings)} embeddings "
            f"using {model}"
        )
        return embeddings
        
    except Exception as e:
        logger.error(f"OpenAI embeddings generation failed: {str(e)}")
        raise EmbeddingsError(f"Failed to generate embeddings: {str(e)}")


def generate_embeddings(
    texts: List[str],
    provider: str = "openai"
) -> List[List[float]]:
    """
    Generate embeddings using specified provider
    
    Args:
        texts: List of texts to embed
        provider: 'openai' or 'local' (future support)
        
    Returns:
        List of embedding vectors
    """
    if provider == "openai":
        return generate_embeddings_openai(texts)
    else:
        raise EmbeddingsError(f"Unsupported embeddings provider: {provider}")


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors
    
    Args:
        vec1: First embedding vector
        vec2: Second embedding vector
        
    Returns:
        Similarity score between -1 and 1
    """
    vec1_np = np.array(vec1)
    vec2_np = np.array(vec2)
    
    dot_product = np.dot(vec1_np, vec2_np)
    norm1 = np.linalg.norm(vec1_np)
    norm2 = np.linalg.norm(vec2_np)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(dot_product / (norm1 * norm2))


def process_knowledge_file_embeddings(
    knowledge_file,
    chunk_size: int = 1000,
    overlap: int = 200
) -> Tuple[bool, Optional[str]]:
    """
    Generate embeddings for a knowledge file's content
    
    Args:
        knowledge_file: KnowledgeBaseFile instance
        chunk_size: Characters per chunk
        overlap: Overlap between chunks
        
    Returns:
        Tuple of (success: bool, error_message: Optional[str])
    """
    try:
        if not knowledge_file.content:
            return False, "No content to process"
        
        # Chunk the text
        chunks = chunk_text(
            knowledge_file.content,
            chunk_size=chunk_size,
            overlap=overlap
        )
        
        if not chunks:
            return False, "Failed to chunk text"
        
        # Generate embeddings
        try:
            embeddings = generate_embeddings(chunks)
        except EmbeddingsError as e:
            return False, str(e)
        
        # Store embeddings and chunks in JSONField
        knowledge_file.embeddings = {
            'chunks': chunks,
            'vectors': embeddings,
            'model': 'text-embedding-3-small',
            'chunk_size': chunk_size,
            'overlap': overlap
        }
        knowledge_file.chunk_count = len(chunks)
        knowledge_file.save()
        
        logger.info(
            f"Generated {len(embeddings)} embeddings "
            f"for knowledge file {knowledge_file.id}"
        )
        return True, None
        
    except Exception as e:
        error_msg = f"Embeddings generation failed: {str(e)}"
        logger.error(
            f"Error processing embeddings for "
            f"knowledge file {knowledge_file.id}: {error_msg}"
        )
        return False, error_msg


def semantic_search(
    query: str,
    bot_id: int,
    top_k: int = 3,
    min_similarity: float = 0.7
) -> List[Dict]:
    """
    Search for relevant knowledge files using semantic similarity
    
    Args:
        query: Search query
        bot_id: Bot ID to filter knowledge files
        top_k: Number of top results to return
        min_similarity: Minimum similarity threshold
        
    Returns:
        List of dicts with file info and relevant chunks
    """
    from core.models import KnowledgeBaseFile
    
    try:
        # Generate embedding for query
        query_embedding = generate_embeddings([query])[0]
        
        # Get all ready knowledge files for this bot with embeddings
        files = KnowledgeBaseFile.objects.filter(
            bot_id=bot_id,
            status='ready',
            embeddings__isnull=False
        )
        
        results = []
        
        for file in files:
            if not file.embeddings or 'vectors' not in file.embeddings:
                continue
            
            chunks = file.embeddings.get('chunks', [])
            vectors = file.embeddings.get('vectors', [])
            
            # Calculate similarity for each chunk
            for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
                similarity = cosine_similarity(query_embedding, vector)
                
                if similarity >= min_similarity:
                    results.append({
                        'file_id': file.id,
                        'file_name': file.name,
                        'chunk_index': idx,
                        'chunk_text': chunk,
                        'similarity': similarity
                    })
        
        # Sort by similarity and return top_k
        results.sort(key=lambda x: x['similarity'], reverse=True)
        top_results = results[:top_k]
        
        logger.info(
            f"Semantic search for '{query}' returned "
            f"{len(top_results)} results"
        )
        return top_results
        
    except Exception as e:
        logger.error(f"Semantic search failed: {str(e)}")
        return []


def build_rag_context(query: str, bot_id: int, max_context: int = 2000) -> str:
    """
    Build context from knowledge base for RAG
    
    Args:
        query: User query
        bot_id: Bot ID
        max_context: Maximum characters for context
        
    Returns:
        Formatted context string
    """
    results = semantic_search(query, bot_id, top_k=5)
    
    if not results:
        return ""
    
    context_parts = ["Relevant information from knowledge base:\n"]
    current_length = len(context_parts[0])
    
    for result in results:
        chunk = result['chunk_text']
        source = f"\n[Source: {result['file_name']}]\n{chunk}\n"
        
        if current_length + len(source) > max_context:
            break
        
        context_parts.append(source)
        current_length += len(source)
    
    return "\n".join(context_parts)
