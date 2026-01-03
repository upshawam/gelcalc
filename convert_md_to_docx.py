#!/usr/bin/env python3
"""
Convert marathon-fueling-protocol.md to a Word document (.docx)
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import re

def markdown_to_docx(md_file, output_file):
    """Convert markdown file to Word document"""
    
    # Read the markdown file
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create a new Document
    doc = Document()
    
    # Split content into lines
    lines = content.split('\n')
    
    in_code_block = False
    in_table = False
    table = None
    current_table_rows = []
    
    for line in lines:
        # Skip empty lines in certain contexts
        if not line.strip():
            if not in_code_block and not in_table:
                doc.add_paragraph()
            continue
        
        # Handle code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            if not in_code_block and line.strip() != '```':
                # Code block with language specification
                pass
            continue
        
        if in_code_block:
            doc.add_paragraph(line, style='Normal').paragraph_format.left_indent = Inches(0.5)
            continue
        
        # Handle tables
        if '|' in line and not table:
            in_table = True
            # Extract table headers
            headers = [h.strip() for h in line.split('|')[1:-1]]
            table = doc.add_table(rows=1, cols=len(headers))
            table.style = 'Light Grid Accent 1'
            
            # Add headers
            header_cells = table.rows[0].cells
            for i, header in enumerate(headers):
                header_cells[i].text = header
            continue
        
        if in_table:
            if '|' in line:
                cells = [c.strip() for c in line.split('|')[1:-1]]
                if len(cells) > 0 and cells[0] and not cells[0].startswith('-'):
                    row = table.add_row()
                    for i, cell in enumerate(cells):
                        if i < len(row.cells):
                            row.cells[i].text = cell
            elif line.strip() and not line.strip().startswith('|') and not line.strip().startswith('-'):
                in_table = False
                table = None
        
        # Handle headings
        if line.startswith('# '):
            doc.add_heading(line[2:].strip(), level=1)
        elif line.startswith('## '):
            doc.add_heading(line[3:].strip(), level=2)
        elif line.startswith('### '):
            doc.add_heading(line[4:].strip(), level=3)
        elif line.startswith('#### '):
            doc.add_heading(line[5:].strip(), level=4)
        
        # Handle bold and italic
        elif line.startswith('- ') or line.startswith('* '):
            # Bullet list
            text = line[2:].strip()
            p = doc.add_paragraph(text, style='List Bullet')
        elif line.startswith('  - ') or line.startswith('  * '):
            # Nested bullet
            text = line[4:].strip()
            p = doc.add_paragraph(text, style='List Bullet 2')
        elif re.match(r'^\d+\. ', line):
            # Numbered list
            text = re.sub(r'^\d+\. ', '', line).strip()
            doc.add_paragraph(text, style='List Number')
        else:
            # Regular paragraph
            if line.strip():
                # Process inline formatting
                text = line.strip()
                p = doc.add_paragraph()
                
                # Simple markdown formatting
                # Handle **bold**
                parts = re.split(r'(\*\*.*?\*\*)', text)
                for part in parts:
                    if part.startswith('**') and part.endswith('**'):
                        run = p.add_run(part[2:-2])
                        run.bold = True
                    elif part.startswith('*') and part.endswith('*') and not part.startswith('**'):
                        run = p.add_run(part[1:-1])
                        run.italic = True
                    elif part.startswith('[') and '](' in part:
                        # Handle links [text](url)
                        match = re.match(r'\[(.*?)\]\((.*?)\)', part)
                        if match:
                            p.add_run(match.group(1))
                        else:
                            p.add_run(part)
                    else:
                        if part:
                            p.add_run(part)
    
    # Save the document
    doc.save(output_file)
    print(f"✓ Document saved to {output_file}")

if __name__ == '__main__':
    md_file = r'FuelingResearch\marathon-fueling-protocol.md'
    output_file = r'FuelingResearch\Marathon-Fueling-Protocol.docx'
    
    markdown_to_docx(md_file, output_file)
