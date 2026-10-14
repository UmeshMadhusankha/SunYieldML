"""Dependency-free artifact checks, runnable using python -m unittest discover."""
import unittest
from app.research import ResearchModel

class ArtifactChecks(unittest.TestCase):
    def test_prediction_and_metadata(self):
        model=ResearchModel()
        self.assertTrue(0 < model.predict(.5,28)['normalizedPlantOutput'] < 1)
        self.assertEqual(model.metadata()['evaluation']['testRows'],670)
        self.assertGreater(model.metadata()['evaluation']['maeReductionVsBaselinePct'],0)
    def test_reject_invalid_feature(self):
        with self.assertRaises(ValueError):
            ResearchModel().predict(float('nan'),28)
        with self.assertRaises(ValueError):
            ResearchModel().predict(500,28)

if __name__=='__main__':
    unittest.main()
